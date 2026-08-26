export type PrimitiveValue = null | string | number | boolean;

export interface StructuredObject {
  [key: string]: StructuredValue;
}

export type StructuredArray = StructuredValue[];

export type StructuredValue =
  StructuredObject | StructuredArray | PrimitiveValue;

export function isStructuredValue(value: unknown): value is StructuredValue {
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

  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);

    if (prototype !== Object.prototype && prototype !== null) {
      return false;
    }

    return Object.values(value).every(isStructuredValue);
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

export function isStructuredProperty(
  value: unknown,
): value is StructuredProperty {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.key === "string" && isStructuredValue(candidate.value)
  );
}

export function isStructuredElement(
  value: unknown,
): value is StructuredElement {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.index === "number" &&
    Number.isInteger(candidate.index) &&
    candidate.index >= 0 &&
    isStructuredValue(candidate.value)
  );
}
