export type PrimitiveColumnValue = string | number | boolean | null;
export type ColumnValue = PrimitiveColumnValue;

export function isColumnValue(value: unknown): value is ColumnValue {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}