import type { Engine } from "./Engine.js";
import type { Database } from "../types/Database.js";
import type { Table } from "../types/Table.js";
import type { TransactionContext } from "./TransactionContext.js";

export class Resolver {
  constructor(private engine: Engine) {}

  resolveTx(): TransactionContext {
    const tx = this.engine.getTx();
    if (!tx) {
      throw new Error("Cannot create table outside of a transaction");
    }
    return tx;
  }

  getDatabase(isMutation: boolean, dbName?: string): Database | undefined {
    const tx = this.resolveTx();

    const inferred = !dbName;

    dbName =
      dbName ??
      tx.currentDatabase ??
      this.engine.currentDatabase ??
      this.engine.defaultDatabase ??
      tx.defaultDatabase;

    if (!dbName) {
      return undefined;
    }

    let database: Database | undefined = tx.getDatabase(dbName);

    if (!database) {
      const engineDb = this.engine.getDatabase(dbName);
      if (!engineDb) {
        return undefined;
      }

      if (isMutation) {
        database = engineDb.clone()
        tx.setDatabase(database); // TODO: write clone()
      } else {
        database = engineDb;
      }
    }

    if (inferred && !tx.currentDatabase) {
      tx.currentDatabase = dbName;
    }

    return database;
  }

  requireDatabase(isMutation: boolean, dbName?: string): Database {
    const db = this.getDatabase(isMutation, dbName);
    if (!db) {
      throw new Error(`Database '${dbName}' not found`);
    }
    return db;
  }

  //TODO, not needed anymore
  resolveDatabase(isMutation: boolean, dbName?: string): Database {
    const tx = this.resolveTx();

    const inferred = !dbName;

    dbName =
      dbName ??
      tx.currentDatabase ??
      this.engine.currentDatabase ??
      this.engine.defaultDatabase ??
      tx.defaultDatabase;

    if (!dbName) throw new Error("No database available");

    let database: Database | undefined = tx.getDatabase(dbName);

    if (!database) {
      const engineDb = this.engine.requireDatabase(dbName);

      if (isMutation) {
        database = engineDb.clone()
        tx.setDatabase(database); // TODO: write clone()
      } else {
        database = engineDb;
      }
    }

    if (inferred && !tx.currentDatabase) {
      tx.currentDatabase = dbName;
    }

    return database;
  }

  getTable(isMutation: boolean, table: string): Table | undefined {
    const [dbName, tableName] = table.includes('.') 
      ? table.split('.', 2) 
      : [undefined, table];

    const db = this.resolveDatabase(isMutation, dbName);

    return db.tables.get(tableName);
  }

  requireTable(isMutation: boolean, table: string): Table {
    const t = this.getTable(isMutation, table);
    if (!t) {
      throw new Error(`Table '${table}' not found`);
    }
    return t;
  }

  //TODO, not needed anymore
  resolveTable(isMutation: boolean, table: string): Table {
    const [dbName, tableName] = table.includes('.') 
      ? table.split('.', 2) 
      : [undefined, table];

    const database = this.resolveDatabase(isMutation, dbName);
    const t = database.tables.get(tableName); // TODO: write getTable(), requireTable()

    if (!t) {
      throw new Error(`Table ${dbName}.${tableName} not found`);
    }

    return t;
  }
}