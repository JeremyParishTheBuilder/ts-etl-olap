import { LiteralExpression } from "../evaluation/expression/LiteralExpression.js";
import type { Column } from "../relational/Column.js";
import type { ColumnValue } from "../types/ColumnValue.js";
import type { DefaultValueNode } from "../ast/DefaultValueNode.js";

export function resolveDefaultValue<TContext>(
  _node: DefaultValueNode,
  column: Column,
  mode: "update" | "insert",
): LiteralExpression<TContext, ColumnValue> {
  return new LiteralExpression(column.resolveDefaultOrThrow(mode));
}
