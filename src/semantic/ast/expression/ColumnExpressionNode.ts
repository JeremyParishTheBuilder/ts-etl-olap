import { asExpressionNode } from "../../../dsl/expression/asExpressionNode.js";
import { type ColumnId } from "../../../schema/Column.js";
import { type ColumnValue } from "../../../types/ColumnValue.js";
import { ComparisonPredicateNode } from "../predicate/ComparisonPredicateNode.js";
import { BinaryExpressionNode } from "./BinaryExpressionNode.js";
import { type ExpressionNode, ExpressionNodeBase } from "./ExpressionNode.js";

export class ResolvedColumnExpressionNode {
  readonly kind = "column" as const;

  constructor(
    public columnId: ColumnId,
  ) {}
}

export class ColumnExpressionNode extends ExpressionNodeBase {
  readonly kind = "column" as const;

  constructor(
    public columnName: string,
  ) {
    super();
  }

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