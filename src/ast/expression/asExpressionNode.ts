import type { ColumnValue } from "../../types/ColumnValue.js";
import { LiteralExpressionNode } from "./LiteralExpressionNode.js";
import type { ExpressionNode } from "./ExpressionNode.js";
import { ExpressionNodeBase } from "./ExpressionNodeBase.js";

export function asExpressionNode(
  value: ColumnValue | ExpressionNode,
): ExpressionNode {
  if (value instanceof ExpressionNodeBase) {
    return value as ExpressionNode;
  }

  return new LiteralExpressionNode(value);
}
