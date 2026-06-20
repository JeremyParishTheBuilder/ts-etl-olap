import { type ColumnValue } from "../../schema/Column.js";
import { type RowView } from "../../schema/RowView.js";
import { type BinaryExpressionNode } from "./BinaryExpressionNode.js";
import { type CaseExpressionNode } from "./CaseExpression.js";
import { type ColumnExpressionNode } from "./ColumnExpression.js";
import { type LiteralExpressionNode } from "./LiteralExpression.js";

export interface Expression {
  evaluate(row: RowView): ColumnValue;
}

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