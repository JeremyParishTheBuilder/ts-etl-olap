import { isExpressionNode, type ExpressionNode } from "../../evaluation/expression/Expression.js";
import { LiteralExpressionNode } from "../../evaluation/expression/LiteralExpression.js";
import { type ColumnValue } from "../../schema/Column.js";
import { type ExplicitInput } from "../../types/ExplicitInput.js";

export function asExpressionNode(
  value: ExpressionNode | ExplicitInput,
): ExpressionNode {
  if (isExpressionNode(value)) {
    return value;
  }

  return new LiteralExpressionNode(value as ColumnValue);
}