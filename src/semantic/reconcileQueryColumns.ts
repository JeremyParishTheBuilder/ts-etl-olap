import type { QueryColumn } from "../evaluation/plan/QueryPlan.js";
import { isAssignable, type SqlType } from "../types/SqlType.js";
import { commonSqlType } from "./expression.js";

export function reconcileQueryColumns(
  left: readonly QueryColumn[],
  right: readonly QueryColumn[],
): QueryColumn[] {
  assertSameColumnLength(left, right);

  const columnLength: number = left.length;

  const names: string[] = getQueryColumnNames(left, right);
  function getQueryColumnNames(
    left: readonly QueryColumn[],
    _right: readonly QueryColumn[],
  ): string[] {
    return left.map((qc) => qc.name);
  }

  const types: SqlType[] = getQueryColumnTypes(left, right);
  function getQueryColumnTypes(
    left: readonly QueryColumn[],
    right: readonly QueryColumn[],
  ): SqlType[] {
    const types: SqlType[] = [];
    for (let i = 0; i < left.length; i++) {
      assertTypesAssignable(left[i].type, right[i].type);

      types[i] = commonSqlType([left[i].type, right[i].type]);
    }
    return types;
  }

  const nullable: boolean[] = getQueryColumnNullability(left, right);
  function getQueryColumnNullability(
    left: readonly QueryColumn[],
    right: readonly QueryColumn[],
  ): boolean[] {
    const nullable: boolean[] = [];
    for (let i = 0; i < left.length; i++) {
      nullable[i] = left[i].nullable || right[i].nullable;
    }
    return nullable;
  }

  const queryColumns: QueryColumn[] = [];
  for (let i = 0; i < columnLength; i++) {
    queryColumns.push({
      name: names[i],
      type: types[i],
      nullable: nullable[i],
    });
  }
  return queryColumns;
}

function assertSameColumnLength(
  left: readonly QueryColumn[],
  right: readonly QueryColumn[],
): void {
  if (left.length !== right.length) {
    throw new Error(`Query column lists must have the same length`);
  }
}

function assertTypesAssignable(typeA: SqlType, typeB: SqlType): void {
  if (!isAssignable(typeA, typeB) && !isAssignable(typeB, typeA)) {
    throw new Error(
      `Incompatible types from column reconciliation: ${typeA}, ${typeB}`,
    );
  }
}
