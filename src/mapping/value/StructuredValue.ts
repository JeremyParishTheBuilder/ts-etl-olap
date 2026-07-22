export type PrimitiveValue =
  | null
  | string
  | number
  | boolean;

export interface StructuredObject {
  [key: string]: StructuredValue;
}

export type StructuredArray = StructuredValue[];

export type StructuredValue =
  | StructuredObject
  | StructuredArray
  | PrimitiveValue;

export function isStructuredValue(
  value: unknown
): value is StructuredValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isStructuredValue);
  }

  if (
    typeof value === "object" &&
    value !== null
  ) {
    return Object.values(value).every(
      isStructuredValue
    );
  }

  return false;
}

export interface StructuredProperty {
  key: string;
  value: StructuredValue;
}

export interface StructuredElement {
  index: number;
  value: StructuredValue;
}