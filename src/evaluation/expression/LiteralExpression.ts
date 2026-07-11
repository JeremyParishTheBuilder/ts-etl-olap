import { type Expression } from "./Expression.js";

export class LiteralExpression<TContext, TValue>
  implements Expression<TContext, TValue> {
  constructor(
    public value: TValue
  ) {}

  evaluate(context: TContext): TValue {
    return this.value;
  }
}