import Database, { Database as DatabaseType } from "better-sqlite3";
import fs from "fs";
import path from "path";
import { IndexingStateRecord, MemoryEntryRecord, SearchResult } from "../types";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS memory_entries (
  id TEXT PRIMARY KEY,
  source_path TEXT NOT NULL,
  source_type TEXT NOT NULL,
  section_heading TEXT,
  content_summary TEXT,
  snippet TEXT,
  tags TEXT,
  status TEXT,
  hash TEXT NOT NULL,
  line_start INTEGER,
  line_end INTEGER,
  updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(
  id,
  section_heading,
  content_summary,
  snippet,
  tags,
  status
);

CREATE TABLE IF NOT EXISTS indexing_state (
  source_path TEXT PRIMARY KEY,
  hash TEXT NOT NULL,
  indexed_at TEXT NOT NULL
);
`;

export type MemoryDatabase = any;

export function openDatabase(dbPath: string): MemoryDatabase {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  runMigrations(db);
  return db;
}

function runMigrations(db: DatabaseType): void {
  // Check for missing 'status' column in memory_entries
  const tableInfo = db.prepare("PRAGMA table_info(memory_entries)").all() as any[];
  const hasStatus = tableInfo.some((col) => col.name === "status");

  if (!hasStatus) {
    db.exec("ALTER TABLE memory_entries ADD COLUMN status TEXT");
    // Drop and recreate FTS to include the new column
    db.exec("DROP TABLE IF EXISTS memory_fts");
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(
        id,
        section_heading,
        content_summary,
        snippet,
        tags,
        status
      );
    `);
    // Re-populate FTS from existing entries
    db.exec(`
      INSERT INTO memory_fts (id, section_heading, content_summary, snippet, tags, status)
      SELECT id, section_heading, content_summary, snippet, tags, status FROM memory_entries
    `);
  }
}

export function closeDatabase(db: MemoryDatabase): void {
  db.close();
}

export function deleteSourceEntries(db: MemoryDatabase, sourcePath: string): void {
  const ids = db.prepare(`SELECT id FROM memory_entries WHERE source_path = ?`).all(sourcePath) as Array<{ id: string }>;
  const deleteEntry = db.prepare(`DELETE FROM memory_entries WHERE id = ?`);
  const deleteFts = db.prepare(`DELETE FROM memory_fts WHERE id = ?`);
  const deleteState = db.prepare(`DELETE FROM indexing_state WHERE source_path = ?`);
  const tx = db.transaction(() => {
    for (const row of ids) {
      deleteEntry.run(row.id);
      deleteFts.run(row.id);
    }
    deleteState.run(sourcePath);
  });
  tx();
}

export function upsertIndexedFile(
  db: MemoryDatabase,
  sourcePath: string,
  hash: string,
  indexedAt: string,
  entries: MemoryEntryRecord[],
): void {
  const deleteBySource = db.prepare(`DELETE FROM memory_entries WHERE source_path = ?`);
  const deleteFtsById = db.prepare(`DELETE FROM memory_fts WHERE id = ?`);
  const insertEntry = db.prepare(`
    INSERT INTO memory_entries (
      id, source_path, source_type, section_heading, content_summary, snippet, tags, status, hash,
      line_start, line_end, updated_at, created_at
    ) VALUES (
      @id, @source_path, @source_type, @section_heading, @content_summary, @snippet, @tags, @status, @hash,
      @line_start, @line_end, @updated_at, @created_at
    )
  `);
  const insertFts = db.prepare(`
    INSERT INTO memory_fts (id, section_heading, content_summary, snippet, tags, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const upsertState = db.prepare(`
    INSERT INTO indexing_state (source_path, hash, indexed_at)
    VALUES (?, ?, ?)
    ON CONFLICT(source_path) DO UPDATE SET hash = excluded.hash, indexed_at = excluded.indexed_at
  `);

  const tx = db.transaction(() => {
    const oldIds = db.prepare(`SELECT id FROM memory_entries WHERE source_path = ?`).all(sourcePath) as Array<{ id: string }>;
    for (const row of oldIds) {
      deleteFtsById.run(row.id);
    }
    deleteBySource.run(sourcePath);
    for (const entry of entries) {
      insertEntry.run(entry);
      insertFts.run(entry.id, entry.section_heading, entry.content_summary, entry.snippet, entry.tags, entry.status);
    }
    upsertState.run(sourcePath, hash, indexedAt);
  });

  tx();
}

export function loadAllEntries(db: MemoryDatabase): MemoryEntryRecord[] {
  return db.prepare(`SELECT * FROM memory_entries ORDER BY source_path, line_start ASC, line_end ASC`).all() as MemoryEntryRecord[];
}

export function loadEntriesBySourcePath(db: MemoryDatabase, sourcePath: string): MemoryEntryRecord[] {
  return db.prepare(`SELECT * FROM memory_entries WHERE source_path = ? ORDER BY line_start ASC, line_end ASC`).all(sourcePath) as MemoryEntryRecord[];
}

export function loadIndexingState(db: MemoryDatabase): IndexingStateRecord[] {
  return db.prepare(`SELECT * FROM indexing_state`).all() as IndexingStateRecord[];
}

export function loadIndexingStateMap(db: MemoryDatabase): Map<string, IndexingStateRecord> {
  const rows = loadIndexingState(db);
  return new Map(rows.map((row) => [row.source_path, row]));
}

export function loadDistinctSourcePaths(db: MemoryDatabase): string[] {
  const rows = db.prepare(`SELECT DISTINCT source_path FROM memory_entries`).all() as Array<{ source_path: string }>;
  return rows.map((row) => row.source_path);
}

export function searchFts(db: MemoryDatabase, query: string, limit = 50): Array<SearchResult> {
  const normalizedQuery = query.trim();
  const rows = normalizedQuery
    ? db
        .prepare(
          `
          SELECT e.*, bm25(memory_fts) AS fts_rank
          FROM memory_fts
          JOIN memory_entries e ON e.id = memory_fts.id
          WHERE memory_fts MATCH ?
          ORDER BY fts_rank ASC
          LIMIT ?
        `,
        )
        .all(normalizedQuery, limit) as Array<SearchResult>
    : db
        .prepare(
          `
          SELECT e.*, NULL AS fts_rank
          FROM memory_entries e
          ORDER BY datetime(updated_at) DESC
          LIMIT ?
        `,
        )
        .all(limit) as Array<SearchResult>;

  return rows;
}

export function countEntries(db: MemoryDatabase): number {
  const row = db.prepare(`SELECT COUNT(*) AS count FROM memory_entries`).get() as { count: number };
  return row.count;
}
