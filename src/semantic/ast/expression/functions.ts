import { ColumnExpressionNode } from "./ColumnExpressionNode.js";

export function column(
  name: string,
) {
  return new ColumnExpressionNode(name);
}