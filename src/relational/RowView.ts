import { type ColumnValue } from "../types/ColumnValue.js";

export type RowView = {
  index: number;
  readonly values: readonly ColumnValue[];
};
