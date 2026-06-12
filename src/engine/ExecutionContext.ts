import { Transaction } from "./Transaction.js";
import type { RulesFacadeShape } from "./RulesFacade.js";

import { type Database } from "../schema/Database.js";
import { type Table } from "../schema/Table.js";

export class ExecutionContext {
  constructor(
    public readonly tx: Transaction,
    public readonly rules: RulesFacadeShape,
    private currentDb?: string,
  ) {}

  public getDatabase(name?: string): Database | undefined {
    const dbName = name ?? this.currentDb;

    if (!dbName) {
      throw new Error("No database selected");
    }

    return this.tx.databases.get(dbName);
  }

  public requireDatabase(name?: string): Database {
    const dbName = name ?? this.currentDb;

    if (!dbName) {
      throw new Error("No database selected");
    }

    return this.tx.databases.require(dbName);
  }

  public getTable(name: string, dbName?: string): Table | undefined {
    return this.getDatabase(dbName)?.tables.getByName(name);
  }

  public requireTable(name: string, dbName?: string): Table {
    return this.requireDatabase(dbName).tables.requireByName(name);
  }
}