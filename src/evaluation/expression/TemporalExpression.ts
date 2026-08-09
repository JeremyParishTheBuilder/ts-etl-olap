import type { ColumnValue } from "../../types/ColumnValue.js";
import type { Expression } from "./Expression.js";

export type TemporalExpressionKind =
  "current_timestamp" | "current_date" | "current_time";

export class TemporalExpression<TContext> implements Expression<
  TContext,
  ColumnValue
> {
  constructor(public readonly expression: TemporalExpressionKind) {}

  evaluate(_context: TContext): ColumnValue {
    const now = new Date();

    switch (this.expression) {
      case "current_timestamp":
        return now.toISOString();

      case "current_date":
        return now.toISOString().slice(0, 10);

      case "current_time":
        return now.toISOString().slice(11);
    }
  }
}
