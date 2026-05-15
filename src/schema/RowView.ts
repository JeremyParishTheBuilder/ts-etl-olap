import { type ColumnValue } from "./Column.js";

export type RowView = {
  index: number;
  readonly values: readonly ColumnValue[];
};