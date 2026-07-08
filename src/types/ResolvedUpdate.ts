import { type ColumnValue } from "../types/ColumnValue.js";

export type ResolvedUpdate = {
  rowNum: number;
  oldRow: ColumnValue[];
  newRow: ColumnValue[];
};