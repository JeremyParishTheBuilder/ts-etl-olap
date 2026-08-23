import type { SqlFunctionKind } from "../../evaluation/expression/SqlFunctionExpression.js";
import { ExpressionNode } from "./ExpressionNode.js";

export class SqlFunctionExpressionNode extends ExpressionNode {
  readonly kind = "sql_function" as const;

  constructor(public readonly function_: SqlFunctionKind) {
    super();
  }
}
