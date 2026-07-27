import { type Expression } from "./Expression.js";

export class LiteralExpression<TContext, TValue>
  implements Expression<TContext, TValue> {
  constructor(
    public value: TValue
  ) {}

  evaluate(_context: TContext): TValue {
    return this.value;
  }
}