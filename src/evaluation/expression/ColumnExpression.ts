import { type RowView } from "../../schema/RowView.js";
import { type ColumnId } from "../../schema/Column.js";
import { type ColumnValue } from "../../types/ColumnValue.js";
import { assertColumnIndexWithinRow } from "../row/assertColumnIndexWithinRow.js";
import { type ExpressionNode } from "./Expression.js";
import { ComparisonPredicateNode } from "../predicate/ComparisonPredicate.js";
import { asExpressionNode } from "../../dsl/expression/asExpressionNode.js";
import { BinaryExpressionNode } from "./BinaryExpressionNode.js";

export class ColumnExpression {
  constructor(
    public columnPosition: number,
  ) {}

  evaluate(row: RowView): ColumnValue {
    assertColumnIndexWithinRow(this.columnPosition, row);

    return row.values[this.columnPosition];
  }
}

export class ResolvedColumnExpressionNode {
  readonly kind = "column" as const;

  constructor(
    public columnId: ColumnId,
  ) {}
}

export class ColumnExpressionNode {
  readonly kind = "column" as const;

  constructor(
    public columnName: string,
  ) {}

  // -- Predicates --
  
  eq(expr: ExpressionNode | ColumnValue) {
    return new ComparisonPredicateNode(
      this,
      "eq",
      asExpressionNode(expr),
    );
  }

  ne(expr: ExpressionNode | ColumnValue) {
    return new ComparisonPredicateNode(
      this,
      "ne",
      asExpressionNode(expr),
    );
  }

  gt(expr: ExpressionNode | ColumnValue) {
    return new ComparisonPredicateNode(
      this,
      "gt",
      asExpressionNode(expr),
    );
  }

  gte(expr: ExpressionNode | ColumnValue) {
    return new ComparisonPredicateNode(
      this,
      "gte",
      asExpressionNode(expr),
    );
  }

  lt(expr: ExpressionNode | ColumnValue) {
    return new ComparisonPredicateNode(
      this,
      "lt",
      asExpressionNode(expr),
    );
  }

  lte(expr: ExpressionNode | ColumnValue) {
    return new ComparisonPredicateNode(
      this,
      "lte",
      asExpressionNode(expr),
    );
  }

  // isNull() {
  //   return new UnaryLogicalPredicateNode(
  //     this.columnNode,
  //     "is_null",
  //     asExpressionNode(null),
  //   );
  // }

  // isNotNull() {
  //   this.parent.addWhereClause({
  //     type: "null_check",
  //     column: this.column,
  //     operator: "is_not_null",
  //   }, this.logicalOp);

  //   return this.parent;
  // }

  // between(lower: ColumnValue, upper: ColumnValue) {
  //   this.parent.addWhereClause({
  //     type: "between",
  //     column: this.column,
  //     lower: lower,
  //     upper: upper,
  //   }, this.logicalOp);

  //   return this.parent;
  // }

  // in(values: ColumnValue[]) {
  //   this.parent.addWhereClause({
  //     type: "in",
  //     column: this.column,
  //     values: values,
  //   }, this.logicalOp);

  //   return this.parent;
  // }

// -- Expressions --

  add(expr: ExpressionNode | ColumnValue) {
    return new BinaryExpressionNode(
      this,
      "add",
      asExpressionNode(expr),
    );
  }

  subtract(expr: ExpressionNode | ColumnValue) {
    return new BinaryExpressionNode(
      this,
      "subtract",
      asExpressionNode(expr),
    );
  }

  multiply(expr: ExpressionNode | ColumnValue) {
    return new BinaryExpressionNode(
      this,
      "multiply",
      asExpressionNode(expr),
    );
  }

  divide(expr: ExpressionNode | ColumnValue) {
    return new BinaryExpressionNode(
      this,
      "divide",
      asExpressionNode(expr),
    );
  }

  mod(expr: ExpressionNode | ColumnValue) {
    return new BinaryExpressionNode(
      this,
      "mod",
      asExpressionNode(expr),
    );
  }
}