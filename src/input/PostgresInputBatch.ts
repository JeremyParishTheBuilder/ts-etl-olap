import { InputBatch } from "./InputBatch.js";
import { ColumnValue, type InlineColumnSpec } from "../schema/Column.js";
import { type ConstraintSpec } from "../schema/Constraint.js";
import { type Statement } from "../statements/Statement.js";

export class PostgresInputBatch extends InputBatch {
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

  alterTable(table: string) {
    return super.alterTable(table);
  }

  addConstraint(name: string) {
    return super.addConstraint(name);
  }

  add(columnName: string, inlineColumnSpec: InlineColumnSpec) {
    return super.addColumn(columnName, inlineColumnSpec);
  }

  foreignKey(columns: string[]) {
    return super.foreignKey(columns);
  }

  references(parentTable: string, parentColumns: string[]) {
    return super.references(parentTable, parentColumns);
  }

  insertInto(table: string, columns: string[] = []) {
    return super.insertInto(table, columns);
  }

  values(data: ColumnValue[][]) {
    return super.values(data);
  }

  returning(cols: string[]) {
    return super.returning(cols);
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

  and(column: string) {
    return super.and(column);
  }

  or(column: string) {
    return super.or(column);
  }

  eq(value: ColumnValue) {
    return super.eq(value);
  }

  ne(value: ColumnValue) {
    return super.ne(value);
  }

  gt(value: ColumnValue) {
    return super.gt(value);
  }

  gte(value: ColumnValue) {
    return super.gte(value);
  }

  lt(value: ColumnValue) {
    return super.lt(value);
  }

  lte(value: ColumnValue) {
    return super.lte(value);
  }
}