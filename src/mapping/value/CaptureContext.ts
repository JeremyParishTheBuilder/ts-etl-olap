import { type ColumnValue } from "../../types/ColumnValue.js";

export interface CaptureContext {
  captures: ReadonlyMap<string, ColumnValue>;
}