import type { ColumnValue } from "./ColumnValue.js";

export interface ResolvedInsert {
  readonly newRow: ColumnValue[];
}
