import { type Expression } from "./Expression.js";

export class ConcatExpression<TContext> implements Expression<
  TContext,
  string
> {
  constructor(readonly expressions: Expression<TContext, unknown>[]) {}

  evaluate(context: TContext): string {
    return this.expressions.map((x) => x.evaluate(context)).join("");
  }
}
