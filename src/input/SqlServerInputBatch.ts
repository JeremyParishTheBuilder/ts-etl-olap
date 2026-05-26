import { InputBatch } from "./InputBatch.js";
import { InlineColumnSpec } from "../schema/Column.js";
import { ConstraintSpec } from "../schema/Constraint.js";
import { type Statement } from "../statements/Statement.js";

export class SqlServerInputBatch extends InputBatch {
  constructor(
    executeStatement: (stmt: Statement) => void,
  ) {
    super(executeStatement);
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

  select(columns: string[] | "*") {
    return super.select(columns);
  }

  from(name: string) {
    return super.from(name);
  }

  where(column: string) {
    return super.where(column);
  }
}