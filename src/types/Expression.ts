import type { ColumnValue } from './Column.js';
 
export type Expression =
  | { kind: "const"; value: ColumnValue }
  | { kind: "identity" }
  | { kind: "map"; cases: Record<string, string>; default?: string; };
export default Expression;