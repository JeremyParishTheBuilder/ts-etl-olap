import type { ExpressionNode } from "../expression/ExpressionNode.js";

export interface SelectItem {
  expression: ExpressionNode;
  alias?: string;
}