import { InputBatch } from "./InputBatch.js";
import { type InlineColumnSpec } from "../relational/Column.js";
import { type ConstraintSpec } from "../relational/Constraint.js";
import { type Statement } from "../statements/Statement.js";
import { type ExplicitInput } from "../types/ExplicitInput.js";
import { type ExpressionNode } from "../evaluation/expression/Expression.js";
import { type PredicateNode } from "../semantic/ast/predicate/PredicateNode.js";
import type { ColumnValue } from "../types/ColumnValue.js";

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

  alterTable(table: string) {
    return super.alterTable(table);
  }

  addConstraint(name: string) {
    return super.addConstraint(name);
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

  set(data: Record<string, ExpressionNode | ExplicitInput>) {
    return super.set(data);
  }

  deleteFrom(table: string) {
    return super.deleteFrom(table);
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

  where(predicate: PredicateNode) {
    return super.where(predicate);
  }

  case() {
    return super.case();
  }

  column(name: string) {
    return super.column(name);
  }

  and(left: PredicateNode, right: PredicateNode) {
    return super.and(left, right);
  }

  or(left: PredicateNode, right: PredicateNode) {
    return super.or(left, right);
  }

  xor(left: PredicateNode, right: PredicateNode) {
    return super.xor(left, right);
  }

  not(inner: PredicateNode) {
    return super.not(inner);
  }
}