import { type ColumnValue } from "../../schema/Column.js";
import { type UpdateSetBuilder } from "../dml/UpdateSetStatement.js";
import { type Builder, type BaseStatement } from "../Statement.js";
import { type WhereClause } from "../WhereClause.js";
import { type SelectBuilder } from "./SelectStatement.js";

export interface WhereStatement extends BaseStatement {
  kind: "where",
  column: string;
  whereClause?: WhereClause;
}

export class WhereColumnBuilder implements Builder {
  constructor(
    private parent: SelectBuilder | UpdateSetBuilder/* | DeleteBuilder*/,
    private column: string,
    private logicalOp?: "and" | "or"
  ) {}

  eq(value: ColumnValue) {
    this.parent.addWhereClause({
      type: "comparison",
      column: this.column,
      operator: "eq",
      value,
    }, this.logicalOp);

    return this.parent;
  }

  ne(value: ColumnValue) {
    this.parent.addWhereClause({
      type: "comparison",
      column: this.column,
      operator: "ne",
      value,
    }, this.logicalOp);

    return this.parent;
  }

  gt(value: ColumnValue) {
    this.parent.addWhereClause({
      type: "comparison",
      column: this.column,
      operator: "gt",
      value,
    }, this.logicalOp);

    return this.parent;
  }

  lt(value: ColumnValue) {
    this.parent.addWhereClause({
      type: "comparison",
      column: this.column,
      operator: "lt",
      value,
    }, this.logicalOp);

    return this.parent;
  }

  gte(value: ColumnValue) {
    this.parent.addWhereClause({
      type: "comparison",
      column: this.column,
      operator: "gte",
      value,
    }, this.logicalOp);

    return this.parent;
  }

  lte(value: ColumnValue) {
    this.parent.addWhereClause({
      type: "comparison",
      column: this.column,
      operator: "lte",
      value,
    }, this.logicalOp);

    return this.parent;
  }

  isNull() {
    this.parent.addWhereClause({
      type: "null_check",
      column: this.column,
      operator: "is_null",
    }, this.logicalOp);

    return this.parent;
  }

  isNotNull() {
    this.parent.addWhereClause({
      type: "null_check",
      column: this.column,
      operator: "is_not_null",
    }, this.logicalOp);

    return this.parent;
  }

  between(lower: ColumnValue, upper: ColumnValue) {
    this.parent.addWhereClause({
      type: "between",
      column: this.column,
      lower: lower,
      upper: upper,
    }, this.logicalOp);

    return this.parent;
  }

  in(values: ColumnValue[]) {
    this.parent.addWhereClause({
      type: "in",
      column: this.column,
      values: values,
    }, this.logicalOp);

    return this.parent;
  }

  getNextCalls() {
    return {
      required: ["eq", "ne", "gt", "lt", "gte", "lte", "isNull", "isNotNull", "between", "in"],
      optional: []
    };
  }
}

