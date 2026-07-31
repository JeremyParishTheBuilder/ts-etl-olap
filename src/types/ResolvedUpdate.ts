import { type ColumnValue } from "../types/ColumnValue.js";

export type ResolvedUpdate = {
  readonly rowNum: number;
  readonly oldRow: ColumnValue[];
  readonly newRow: ColumnValue[];
};
