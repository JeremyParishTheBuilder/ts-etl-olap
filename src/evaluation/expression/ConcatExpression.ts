import { type Expression, ExpressionNode, ExpressionNodeBase } from "./Expression.js";

export class ConcatExpression<TContext>
  implements Expression<TContext, string> {
    
  constructor(
    readonly expressions: Expression<TContext, unknown>[]
  ) {}

  evaluate(context: TContext): string {
    return this.expressions
      .map(x => x.evaluate(context))
      .join("");
  }
}

export class ConcatExpressionNode extends ExpressionNodeBase {
  readonly kind = "concat" as const;

  constructor(
    public readonly expressions: ExpressionNode[],
  ) {
    super();
  }
}