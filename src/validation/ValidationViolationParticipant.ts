import type { ColumnId } from "../relational/Column.js";
import type { TableId } from "../relational/Table.js";
import type { ColumnValue } from "../types/ColumnValue.js";

export interface ValidationViolationParticipant {
  readonly table: TableId;
  readonly tableName: string;

  readonly rowId: number;

  readonly columns: readonly ColumnId[];
  readonly columnNames: readonly string[];
  readonly columnValues: readonly ColumnValue[];

  readonly referencedTable?: TableId;
  readonly referencedTableName?: string;

  readonly referencedColumns?: readonly ColumnId[];
  readonly referencedColumnNames?: readonly string[];
}
