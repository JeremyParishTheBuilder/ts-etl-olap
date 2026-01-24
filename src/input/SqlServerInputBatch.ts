import { InputBatch } from "./InputBatch.js";
import { type RulesFacadeShape } from "../engine/RulesFacade.js";
import { type TransactionContext } from "../engine/TransactionContext.js";
import { InlineColumnSpec } from "../types/Column.js";
import { ConstraintSpec } from "../types/Constraint.js";

export class SqlServerInputBatch extends InputBatch {
  constructor(
    rules: RulesFacadeShape,
    beginTx: () => void,
    commitTx: () => void,
    getTx: () => TransactionContext | undefined
  ) {
    super(rules, beginTx, commitTx, getTx);
  }

  begin() {
    return super.begin();
  }

  commit() {
    return super.commit();
  }

  useDatabase(dbName: string) {
    return super.useDatabase(dbName);
  }

  createDatabase(dbName: string) {
    return super.createDatabase(dbName);
  }

  createTable(
    table: string,
    columnSchema: Record<string, InlineColumnSpec>,
    constraintSchema: Record<string, ConstraintSpec> = {}
  ) {
    return super.createTable(table, columnSchema, constraintSchema);
  }

  insertInto(table: string, columns: string[] = []) {
    return super.insertInto(table, columns);
  }

  values(data: any[][]) {
    return super.values(data);
  }

  output(cols: string[]) {
    return super.returning(cols, "OUTPUT");
  }
}