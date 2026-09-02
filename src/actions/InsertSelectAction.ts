import type { QueryPlan } from "../evaluation/plan/QueryPlan.js";
import type { ColumnId } from "../relational/Column.js";
import type { Databases } from "../relational/Databases.js";
import type { RowView } from "../relational/RowView.js";
import type { ColumnInput } from "../types/ColumnInput.js";
import type { Action } from "./Action.js";

export class InsertSelectAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private queryPlan: QueryPlan,
    private targetColumns?: ColumnId[],
    //When target column IDs are supplied, insert into those explicitly resolved columns. When omitted, map query result columns to the newly created destination columns by query-result column name.
  ) {}

  apply(databases: Databases) {
    const db = databases.requireByName(this.dbName);

    const table = db.tables.requireByName(this.tableName);

    // TODO, make targetColumns required, but maybe it's just names/strings

    const columnIds: ColumnId[] = this.targetColumns
      ? this.targetColumns
      : this.queryPlan.columns.map(qc =>
        table.columns.requireIdByName(qc.name)
      );

    const queryRows: IterableIterator<RowView> = this.queryPlan.root.execute();

    const inputRows: Map<ColumnId, ColumnInput>[] = mapQueryRowsToInsertRows(
      queryRows,
      columnIds,
    );

    //TODO
    console.log("take al ook at this");
    console.log(inputRows);

    const updatedDatabase = db.addRows(this.tableName, inputRows);

    return databases.update(updatedDatabase);
  }
}

function mapQueryRowsToInsertRows(
  rows: Iterable<RowView>,
  targetColumns: ColumnId[],
): Map<ColumnId, ColumnInput>[] {
  const inputRows: Map<ColumnId, ColumnInput>[] = [];

  for (const row of rows) {
    if (row.values.length !== targetColumns.length) {
      throw new Error(
        "Query result column count does not match INSERT target column count.",
      );
    }

    const inputRow = new Map<ColumnId, ColumnInput>();

    for (let i = 0; i < targetColumns.length; i++) {
      inputRow.set(targetColumns[i], row.values[i]);
    }

    inputRows.push(inputRow);
  }

  return inputRows;
}
