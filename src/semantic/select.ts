import { type PlanNode } from "../evaluation/plan/PlanNode.js";
import { TableScanNode } from "../evaluation/plan/TableScanNode.js";
import { FilterNode } from "../evaluation/plan/FilterNode.js";

import { type SelectStatement } from "../statements/index.js";
import { type SemanticAnalyzer } from "./SemanticAnalyzer.js";
import { bindPredicate, resolvePredicate } from "./predicate.js";
import type { QueryColumn, QueryPlan } from "../evaluation/plan/QueryPlan.js";
import { ExpressionNode, type ResolvedExpressionNode } from "../ast/expression/ExpressionNode.js";
import { bindExpression, getExpressionNullability, getNameFromExpression, resolveExpression, sqlTypeFromExpression } from "./expression.js";
import type { Expression } from "../evaluation/expression/Expression.js";
import type { RowView } from "../relational/RowView.js";
import { EvaluateNode } from "../evaluation/plan/EvaluateNode.js";
import type { SqlType } from "../types/SqlType.js";
import type { ColumnValue } from "../types/ColumnValue.js";
import type { SelectItem } from "../ast/query/SelectItem.js";
import { asExpressionNode } from "../ast/expression/asExpressionNode.js";
import { getAllColumnsAsSelectItems } from "./resolveColumnList.js";
import type { Table } from "../relational/Table.js";
import { IdAllocator } from "../types/IdAllocator.js";

export function bindSelect(
  semantic: SemanticAnalyzer,
  stmt: SelectStatement,
): QueryPlan {
  //Get table
  const table = semantic.ctx.requireTable(stmt.tableName);

  const defaultColumnName: string = semantic.ctx.rules.default.resultColumnName;
  const defaultColumnCounter = new IdAllocator<number>();

  const usedColumnNames = new Set<string>();

  // 2. Base node
  let node: PlanNode = new TableScanNode(table);

  // 3. WHERE -> predicate -> filter
  const whereClause = stmt.where;
  if (whereClause) {
    const predicate = bindPredicate(
      resolvePredicate(whereClause, table),
      table,
    );

    node = new FilterNode(predicate, node);
  }

  //TODO, check that resolveSelectColumns is still used, otherwise, remove

  const selectItems =
    stmt.expressions === "*"
      ? getAllColumnsAsSelectItems(table)
      : normalizeSelectInputs(stmt.expressions);

  const boundItems = selectItems.map((item) => {
    const resolved = resolveExpression(item.expression, table);
    const bound = bindExpression(resolved, table);

    return {
      item,
      resolved,
      bound,
    };
  });

  node = new EvaluateNode(boundItems.map((x) => x.bound), node);

  const allocateColumnName = (
    name: string | undefined,
  ): string => {
    const result = name ?? `${defaultColumnName}${defaultColumnCounter.allocate()}`;

    if (result.startsWith(defaultColumnName) && name !== undefined) {
      throw new Error(
        `Column name "${result}" uses the reserved default column name prefix`,
      );
    }

    if (usedColumnNames.has(result)) {
      throw new Error(`Duplicate result column name: ${result}`);
    }

    usedColumnNames.add(result);
    return result;
  };

  // 5. Result Metadata
  const columns: QueryColumn[] = boundItems.map((x) => ({
    name: allocateColumnName(
      getSelectColumnName(
        x.item,
        x.resolved,
        table,
      )
    ),
    type: sqlTypeFromExpression(
      x.resolved,
      table,
    ),
    nullable: getExpressionNullability(
      x.resolved,
      table,
    ),
  }));

  return {
    root: node,
    columns,
  };
}

function isSelectItem(value: unknown): value is SelectItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "expression" in value
  );
}

function normalizeSelectInputs(
  expressions: (ExpressionNode | ColumnValue | SelectItem)[],
): SelectItem[] {
  return expressions.map((item) => {
    if (isSelectItem(item)) {
      return item;
    }

    return {
      expression: asExpressionNode(item),
    };
  });
}

function getSelectColumnName(
  item: SelectItem,
  resolvedExpression: ResolvedExpressionNode,
  table: Table,
): string | undefined {
  const alias = item.alias;
  if (alias) {
    return alias;
  }

  const nameFromExpression = getNameFromExpression(
    resolvedExpression,
    table,
  );

  if (nameFromExpression) {
    return nameFromExpression;
  }
}