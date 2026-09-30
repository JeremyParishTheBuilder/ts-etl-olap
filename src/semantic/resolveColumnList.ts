import { ColumnExpressionNode } from "../ast/expression/ColumnExpressionNode.js";
import type { SelectItem } from "../ast/query/SelectItem.js";
import { type Column } from "../relational/Column.js";
import { type Table } from "../relational/Table.js";
import type { RelationBinding } from "./relation/RelationBinding.js";

export function resolveTargetColumns(
  table: Table,
  statementColumns: string[],
): Column[] {
  if (
    statementColumns.length === 0 ||
    (statementColumns.length === 1 && statementColumns[0] === "*")
  ) {
    return table.getColumnsInOrder();
  }

  const seen = new Set<string>();
  const result: Column[] = [];

  for (const name of statementColumns) {
    const normalized = name.toLowerCase();

    if (seen.has(normalized)) {
      throw new Error(`Duplicate column: ${name}`);
    }

    seen.add(normalized);

    result.push(table.columns.requireByName(name));
  }

  return result;
}

export function getAllColumnsAsSelectItems(
  relations: readonly RelationBinding[],
): SelectItem[] {
  return relations.flatMap((relation) =>
    relation.columns.map((column) => ({
      expression: new ColumnExpressionNode(
        relation.name
          ? `${relation.name}.${column.column.name}`
          : column.column.name,
      ),
    })),
  );
}
