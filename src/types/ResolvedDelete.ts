import { type ColumnValue } from "../types/ColumnValue.js";

export type ResolvedDelete = {
  readonly rowNum: number;
  readonly oldRow: ColumnValue[];
};
