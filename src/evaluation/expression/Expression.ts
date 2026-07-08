import { type ColumnValue } from "../../types/ColumnValue.js";
import { type RowView } from "../../schema/RowView.js";
import { type ResolvedBinaryExpressionNode, type BinaryExpressionNode } from "./BinaryExpressionNode.js";
import { type ResolvedCaseExpressionNode, type CaseExpressionNode } from "./CaseExpression.js";
import { type ResolvedColumnExpressionNode, type ColumnExpressionNode } from "./ColumnExpression.js";
import { type LiteralExpressionNode } from "./LiteralExpression.js";

export interface Expression {
  evaluate(row: RowView): ColumnValue;
}

export type ResolvedExpressionNode =
  | ResolvedColumnExpressionNode
  | LiteralExpressionNode
  | ResolvedCaseExpressionNode
  | ResolvedBinaryExpressionNode;

export type ExpressionNode =
  | ColumnExpressionNode
  | LiteralExpressionNode
  | CaseExpressionNode
  | BinaryExpressionNode;

export function isExpressionNode(
  value: unknown,
): value is ExpressionNode {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value
  );
}