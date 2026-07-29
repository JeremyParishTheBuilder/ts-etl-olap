import { type ColumnValue } from "../../types/ColumnValue.js";

export function assertIsNumber(result: ColumnValue): asserts result is number {
  if (typeof result !== "number") {
    throw new Error("Expected number");
  }
}
