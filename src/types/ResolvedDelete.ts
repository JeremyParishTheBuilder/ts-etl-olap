import { type ColumnValue } from "../types/ColumnValue.js";

export type ResolvedDelete = {
  rowNum: number;
  oldRow: ColumnValue[];
};