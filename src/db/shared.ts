import Database, { Database as DatabaseType } from "better-sqlite3";
import fs from "fs";
import path from "path";

const SHARED_SCHEMA = `
CREATE TABLE IF NOT EXISTS shared_memory_entries (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source_project TEXT,
  source_project_hash TEXT,
  language TEXT NOT NULL,
  framework TEXT,
  content TEXT NOT NULL,
  tags TEXT,
  status TEXT DEFAULT 'active',
  updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shared_language ON shared_memory_entries(language);
CREATE INDEX IF NOT EXISTS idx_shared_framework ON shared_memory_entries(framework);
CREATE INDEX IF NOT EXISTS idx_shared_status ON shared_memory_entries(status);

CREATE VIRTUAL TABLE IF NOT EXISTS shared_memory_fts USING fts5(
  id UNINDEXED,
  title,
  content,
  tags
);
`;

export interface SharedMemoryEntry {
  id: string;
  title: string;
  source_project?: string;
  source_project_hash?: string;
  language: string;
  framework?: string;
  content: string;
  tags?: string;
  status: string;
  updated_at: string;
  created_at: string;
}

export type SharedDatabase = any;

export function openSharedDatabase(dbPath: string): SharedDatabase {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SHARED_SCHEMA);

  // Migration safeguard: check if source_project_hash column exists
  const info = db.pragma("table_info(shared_memory_entries)") as any[];
  const hasProjectHash = info.some((col: any) => col.name === "source_project_hash");
  if (!hasProjectHash) {
    db.exec("ALTER TABLE shared_memory_entries ADD COLUMN source_project_hash TEXT;");
  }

  return db;
}

export function upsertSharedEntry(db: SharedDatabase, entry: SharedMemoryEntry): void {
  const insertEntry = db.prepare(`
    INSERT INTO shared_memory_entries (
      id, title, source_project, source_project_hash, language, framework, content, tags, status, updated_at, created_at
    ) VALUES (
      @id, @title, @source_project, @source_project_hash, @language, @framework, @content, @tags, @status, @updated_at, @created_at
    )
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      source_project = excluded.source_project,
      source_project_hash = excluded.source_project_hash,
      language = excluded.language,
      framework = excluded.framework,
      content = excluded.content,
      tags = excluded.tags,
      status = excluded.status,
      updated_at = excluded.updated_at
  `);

  const deleteFts = db.prepare(`DELETE FROM shared_memory_fts WHERE id = ?`);
  const insertFts = db.prepare(`
    INSERT INTO shared_memory_fts (id, title, content, tags)
    VALUES (?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    insertEntry.run(entry);
    deleteFts.run(entry.id);
    insertFts.run(entry.id, entry.title, entry.content, entry.tags || "");
  });

  tx();
}

export function searchSharedEntries(
  db: SharedDatabase,
  query: string,
  language?: string,
  framework?: string,
  limit = 20
): Array<SharedMemoryEntry & { score?: number }> {
  const normalizedQuery = query.trim();
  
  let baseQuery = `
    SELECT s.*, bm25(shared_memory_fts) AS fts_rank
    FROM shared_memory_fts
    JOIN shared_memory_entries s ON s.id = shared_memory_fts.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (normalizedQuery) {
    baseQuery += ` AND shared_memory_fts MATCH ?`;
    params.push(normalizedQuery);
  } else {
    // If no query, return latest entries
    baseQuery = `
      SELECT s.*, NULL AS fts_rank
      FROM shared_memory_entries s
      WHERE 1=1
    `;
  }

  if (language) {
    baseQuery += ` AND s.language = ?`;
    params.push(language);
  }

  if (framework) {
    baseQuery += ` AND s.framework = ?`;
    params.push(framework);
  }

  if (normalizedQuery) {
    baseQuery += ` ORDER BY fts_rank ASC`;
  } else {
    baseQuery += ` ORDER BY datetime(s.updated_at) DESC`;
  }

  baseQuery += ` LIMIT ?`;
  params.push(limit);

  return db.prepare(baseQuery).all(...params) as Array<SharedMemoryEntry & { score?: number }>;
}

export function loadAllSharedEntries(db: SharedDatabase): SharedMemoryEntry[] {
  return db.prepare(`SELECT * FROM shared_memory_entries ORDER BY updated_at DESC`).all() as SharedMemoryEntry[];
}
