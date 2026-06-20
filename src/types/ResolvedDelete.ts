import { type ColumnValue } from "../schema/Column.js";
import { type TableId } from "../schema/Table.js";

export type ResolvedDelete = {
  //tableId: TableId;
  rowNum: number;
  oldRow: ColumnValue[];
};