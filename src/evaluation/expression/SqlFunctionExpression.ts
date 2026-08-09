import type { ColumnValue } from "../../types/ColumnValue.js";
import type { Expression } from "./Expression.js";

export type SqlFunctionKind = "now" | "getdate";

export class SqlFunctionExpression<TContext> implements Expression<TContext> {
  constructor(public readonly function_: SqlFunctionKind) {}

  evaluate(_context: TContext): ColumnValue {
    return new Date().toISOString();
  }
}
