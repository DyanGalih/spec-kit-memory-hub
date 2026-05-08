declare module "better-sqlite3" {
  export interface Database {
    pragma(str: string): any;
    exec(str: string): void;
    prepare(str: string): Statement;
    transaction<T extends (...args: any[]) => any>(fn: T): T;
    close(): void;
  }
  export interface Statement {
    all(...args: any[]): any[];
    get(...args: any[]): any;
    run(...args: any[]): { changes: number; lastInsertRowid: number | bigint };
  }
  const Database: {
    new (path: string, options?: any): Database;
  };
  export default Database;
}

declare module "markdown-it" {
  const MarkdownIt: any;
  export default MarkdownIt;
}
