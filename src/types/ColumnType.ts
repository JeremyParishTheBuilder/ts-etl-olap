import { type ColumnValue } from "./ColumnValue.js";

export type ColumnType =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | "unknown";

export function isTypeCompatible(type1: ColumnType, type2: ColumnType): boolean {
  return type1 === type2;
}

export function matchesColumnType(
  value: unknown,
  type: ColumnType
): boolean {
  if (value === null) {
    return true;
  }

  switch (type) {
    case String:
      return typeof value === "string";
    case Number:
      return typeof value === "number" && !Number.isNaN(value);
    case Boolean:
      return typeof value === "boolean";
    case "unknown":
      return true;
  }

  return false;
}

export function columnTypeFromValue(value: ColumnValue): ColumnType {
  if (value === null) {
    return "unknown";
  }

  switch (typeof value) {
    case "string":
      return String;

    case "number":
      return Number;

    case "boolean":
      return Boolean;
  }

  throw new Error("Unexpected column value.");
}