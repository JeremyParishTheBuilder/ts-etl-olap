import type { SqlFunctionKind } from "../../evaluation/expression/SqlFunctionExpression.js";
import { ExpressionNodeBase } from "./ExpressionNodeBase.js";

export class SqlFunctionExpressionNode extends ExpressionNodeBase {
  readonly kind = "sql_function" as const;

  constructor(public readonly function_: SqlFunctionKind) {
    super();
  }
}
