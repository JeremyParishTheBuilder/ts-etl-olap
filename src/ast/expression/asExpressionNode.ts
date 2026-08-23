import type { ColumnValue } from "../../types/ColumnValue.js";
import { LiteralExpressionNode } from "./LiteralExpressionNode.js";
import type { ExpressionNode } from "./ExpressionNode.js";

function isExpressionNode(value: unknown): value is ExpressionNode {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return "kind" in value;
}

export function asExpressionNode(
  value: ColumnValue | ExpressionNode,
): ExpressionNode {
  if (isExpressionNode(value)) {
    return value as ExpressionNode;
  }

  return new LiteralExpressionNode(value);
}
