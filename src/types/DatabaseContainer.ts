import type { Database } from "./Database.js";

export abstract class DatabaseContainer {
  protected databases: Map<string, Database> = new Map();
  public currentDatabase?: string;

  public get defaultDatabase(): string | undefined {
    return this.databases.keys().next().value;
  }

  getDatabase(name?: string): Database | undefined {
    const dbName = name ?? this.currentDatabase;
    if (!dbName) throw new Error("No database selected");
    return this.databases.get(dbName);
  }

  requireDatabase(name?: string): Database {
    const db = this.getDatabase(name);
    if (!db) throw new Error(`Database '${name ?? "unknown"}' not found`);
    return db;
  }

  setDatabase(db: Database) {
    if (this.databases.has(db.name)) {
      throw new Error(`Database '${db.name}' already exists`);
    }
    this.databases.set(db.name, db);
  }
}