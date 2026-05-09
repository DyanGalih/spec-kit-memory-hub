export interface RetrievalConfig {
  max_index_entries: number;
  max_memory_results: number;
  max_doc_results: number;
  max_code_results: number;
  max_decisions: number;
  max_architecture_constraints: number;
  max_accepted_deviations: number;
  max_security_constraints: number;
  max_bug_patterns: number;
  max_worklog_items: number;
  max_synthesis_words: number;
  full_memory_read_allowed: boolean;
  full_scan_allowed: boolean;
}

export interface OptimizerConfig {
  enabled: boolean;
  engine: "sqlite";
  db_path: string;
  auto_index_on_memory_change: boolean;
  auto_index_on_doc_change: boolean;
  auto_index_on_code_change: boolean;
  auto_generate_synthesis: boolean;
}

export interface IndexingConfig {
  include: {
    memory: string[];
    docs: string[];
    code: string[];
  };
  exclude: string[];
}

export interface MemoryHubConfig {
  memory_root: string;
  specs_root: string;
  feature_memory_filename: string;
  memory_synthesis_filename: string;
  require_memory_synthesis_before_plan: boolean;
  require_memory_review_before_verify: boolean;
  use_project_copilot_instructions: boolean;
  definition_of_done_includes_memory_review: boolean;
  retrieval: RetrievalConfig;
  optimizer: OptimizerConfig;
  indexing: IndexingConfig;
}

export type MemorySourceType = "memory";

export interface MemoryEntryRecord {
  id: string;
  source_path: string;
  source_type: MemorySourceType;
  section_heading: string | null;
  content_summary: string | null;
  snippet: string | null;
  tags: string | null;
  status: string | null;
  hash: string;
  line_start: number | null;
  line_end: number | null;
  updated_at: string;
  created_at: string;
}

export interface IndexingStateRecord {
  source_path: string;
  hash: string;
  indexed_at: string;
}

export interface SearchResult extends MemoryEntryRecord {
  score: number;
  fts_rank: number | null;
  reason: string[];
}

export interface ParsedChunk {
  headingPath: string[];
  section_heading: string;
  line_start: number;
  line_end: number;
  rawContent: string;
  textContent: string;
  summary: string;
  snippet: string;
  tags: string[];
  hash: string;
}

export interface SynthesisSectionItem {
  id: string;
  title: string;
  sourcePath: string;
  sectionHeading: string;
  summary: string;
  snippet: string;
  tags: string[];
  lineStart: number | null;
  lineEnd: number | null;
}

export interface SynthesisDocument {
  feature: string;
  outputPath: string;
  content: string;
  words: number;
  sourceItems: SynthesisSectionItem[];
  retrievalNotes: string[];
}
