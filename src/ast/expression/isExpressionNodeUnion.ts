import type { ExpressionNode, ExpressionNodeUnion } from "./ExpressionNode.js";

export function isExpressionNodeUnion(
  expr: ExpressionNode,
): expr is ExpressionNodeUnion {
  switch (expr.kind) {
    case "literal":
    case "column":
    case "case":
    case "cast":
    case "binary":
    case "concat":
    case "temporal":
    case "sql_function":
      return true;

    default:
      return false;
  }
}
