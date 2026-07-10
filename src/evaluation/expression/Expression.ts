import { type ColumnValue } from "../../types/ColumnValue.js";
import { type RowView } from "../../schema/RowView.js";
import { BinaryExpressionNode, type ResolvedBinaryExpressionNode } from "./BinaryExpression.js";
import { type ResolvedCaseExpressionNode, type CaseExpressionNode } from "./CaseExpression.js";
import { type ResolvedColumnExpressionNode, type ColumnExpressionNode } from "./ColumnExpression.js";
import { type LiteralExpressionNode } from "./LiteralExpression.js";
import { ConcatExpressionNode } from "./ConcatExpression.js";

export interface Expression<
  TContext = RowView,
  TValue = ColumnValue
> {
  evaluate(context: TContext): TValue;
}
// Contexts: DiscoveryContext, RowView

export type ResolvedExpressionNode =
  | ResolvedColumnExpressionNode
  | LiteralExpressionNode
  | ResolvedCaseExpressionNode
  | ResolvedBinaryExpressionNode
  | ConcatExpressionNode;
  //| JsonExpressionNode
  //| CaptureExpressionNode;

export type ExpressionNode =
  | ColumnExpressionNode
  | LiteralExpressionNode
  | CaseExpressionNode
  | BinaryExpressionNode
  //| JsonExpressionNode
  //| CaptureExpressionNode
  | ConcatExpressionNode;

export abstract class ExpressionNodeBase {
  abstract readonly kind: string;

  // eq(expr: ExpressionNode | ColumnValue) {
  //   return new ComparisonPredicateNode(
  //     this,
  //     "eq",
  //     asExpressionNode(expr),
  //   );
  // }

  // ne(expr: ExpressionNode | ColumnValue) {
  //   return new ComparisonPredicateNode(
  //     this,
  //     "ne",
  //     asExpressionNode(expr),
  //   );
  // }

  // gt(expr: ExpressionNode | ColumnValue) {
  //   return new ComparisonPredicateNode(
  //     this,
  //     "gt",
  //     asExpressionNode(expr),
  //   );
  // }

  // gte(expr: ExpressionNode | ColumnValue) {
  //   return new ComparisonPredicateNode(
  //     this,
  //     "gte",
  //     asExpressionNode(expr),
  //   );
  // }

  // lt(expr: ExpressionNode | ColumnValue) {
  //   return new ComparisonPredicateNode(
  //     this,
  //     "lt",
  //     asExpressionNode(expr),
  //   );
  // }

  // lte(expr: ExpressionNode | ColumnValue) {
  //   return new ComparisonPredicateNode(
  //     this as unknown as ExpressionNode, // error
  //     "lte",
  //     asExpressionNode(expr),
  //   );
  // }

  // add(expr: ExpressionNode | ColumnValue) {
  //   return new BinaryExpressionNode(
  //     this as ExpressionNode, // error
  //     "add",
  //     asExpressionNode(expr),
  //   );
  // }

  // subtract(expr: ExpressionNode | ColumnValue) {
  //   return new BinaryExpressionNode(
  //     this,
  //     "subtract",
  //     asExpressionNode(expr),
  //   );
  // }

  // multiply(expr: ExpressionNode | ColumnValue) {
  //   return new BinaryExpressionNode(
  //     this,
  //     "multiply",
  //     asExpressionNode(expr),
  //   );
  // }

  // divide(expr: ExpressionNode | ColumnValue) {
  //   return new BinaryExpressionNode(
  //     this,
  //     "divide",
  //     asExpressionNode(expr),
  //   );
  // }

  // mod(expr: ExpressionNode | ColumnValue) {
  //   return new BinaryExpressionNode(
  //     this,
  //     "mod",
  //     asExpressionNode(expr),
  //   );
  // }

  // TODO
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
}

export function isExpressionNode(
  value: unknown,
): value is ExpressionNode {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value
  );
}