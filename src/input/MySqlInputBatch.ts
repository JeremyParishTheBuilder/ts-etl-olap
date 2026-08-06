import { InputBatch } from "./InputBatch.js";
import { type InlineColumnSpec } from "../relational/Column.js";
import { type ConstraintSpec } from "../relational/Constraint.js";
import { type Statement } from "../statements/Statement.js";
import { type PredicateNode } from "../semantic/ast/predicate/PredicateNode.js";
import type { ColumnValue } from "../types/ColumnValue.js";
import type { ExpressionNode } from "../semantic/ast/expression/ExpressionNode.js";

export class MySqlInputBatch extends InputBatch {
  constructor(executeStatement: (stmt: Statement) => void) {
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
    constraintSchema: Record<string, ConstraintSpec> = {},
  ) {
    return super.createTable(table, columnSchema, constraintSchema);
  }

  alterTable(table: string) {
    return super.alterTable(table);
  }

  addConstraint(name: string) {
    return super.addConstraint(name);
  }

  unique(columns: string[]) {
    return super.unique(columns);
  }

  check(predicate: PredicateNode) {
    return super.check(predicate);
  }

  insertInto(table: string, columns: string[] = []) {
    return super.insertInto(table, columns);
  }

  values(data: ColumnValue[][]) {
    return super.values(data);
  }

  update(table: string) {
    return super.update(table);
  }

  set(data: Record<string, ExpressionNode | ColumnValue>) {
    return super.set(data);
  }

  deleteFrom(table: string) {
    return super.deleteFrom(table);
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

  where(predicate: PredicateNode) {
    return super.where(predicate);
  }
}
