import { ColumnValue } from "../../schema/Column.js";

export function assertComparable(
  left: ColumnValue,
  right: ColumnValue,
): void {
  if (!typesAreComparable(left, right)) {
    throw new Error(
      `Values are not comparable`
    );
  }
}

function typesAreComparable(a: ColumnValue, b: ColumnValue): boolean {
  if (
    (typeof a !== "number" && typeof a !== "string") ||
    (typeof b !== "number" && typeof b !== "string") ||
    typeof a !== typeof b
  ) {
    return false;
  }
  return true;
}