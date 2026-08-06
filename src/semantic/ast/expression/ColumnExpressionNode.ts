import { type ColumnId } from "../../../relational/Column.js";
import type { ColumnValue } from "../../../types/ColumnValue.js";
import { ComparisonPredicateNode } from "../predicate/ComparisonPredicateNode.js";
import { IsNotNullPredicateNode } from "../predicate/IsNotNullPredicateNode.js";
import { IsNullPredicateNode } from "../predicate/IsNullPredicateNode.js";
import { asExpressionNode } from "./asExpressionNode.js";
import { BinaryExpressionNode } from "./BinaryExpressionNode.js";
import type { ExpressionNode } from "./ExpressionNode.js";
import { ExpressionNodeBase } from "./ExpressionNodeBase.js";

export class ResolvedColumnExpressionNode {
  readonly kind = "column" as const;

  constructor(public columnId: ColumnId) {}
}

export class ColumnExpressionNode extends ExpressionNodeBase {
  readonly kind = "column" as const;

  constructor(public columnName: string) {
    super();
  }

  eq(expr: ExpressionNode | ColumnValue) {
    return new ComparisonPredicateNode(this, "eq", asExpressionNode(expr));
  }

  ne(expr: ExpressionNode | ColumnValue) {
    return new ComparisonPredicateNode(this, "ne", asExpressionNode(expr));
  }

  gt(expr: ExpressionNode | ColumnValue) {
    return new ComparisonPredicateNode(this, "gt", asExpressionNode(expr));
  }

  gte(expr: ExpressionNode | ColumnValue) {
    return new ComparisonPredicateNode(this, "gte", asExpressionNode(expr));
  }

  lt(expr: ExpressionNode | ColumnValue) {
    return new ComparisonPredicateNode(this, "lt", asExpressionNode(expr));
  }

  lte(expr: ExpressionNode | ColumnValue) {
    return new ComparisonPredicateNode(this, "lte", asExpressionNode(expr));
  }

  isNull() {
    return new IsNullPredicateNode(this);
  }

  isNotNull() {
    return new IsNotNullPredicateNode(this);
  }

  add(expr: ExpressionNode | ColumnValue) {
    return new BinaryExpressionNode(this, "add", asExpressionNode(expr));
  }

  subtract(expr: ExpressionNode | ColumnValue) {
    return new BinaryExpressionNode(this, "subtract", asExpressionNode(expr));
  }

  multiply(expr: ExpressionNode | ColumnValue) {
    return new BinaryExpressionNode(this, "multiply", asExpressionNode(expr));
  }

  divide(expr: ExpressionNode | ColumnValue) {
    return new BinaryExpressionNode(this, "divide", asExpressionNode(expr));
  }

  mod(expr: ExpressionNode | ColumnValue) {
    return new BinaryExpressionNode(this, "mod", asExpressionNode(expr));
  }
}
