import { type ColumnValue } from "../schema/Column";

export type SemanticValue =
  | { kind: "value"; value: ColumnValue }
  | { kind: "default" }
  | { kind: "null" }
  | { kind: "generated" }
  | { kind: "expression"; expr: any/*Expression*/ };

export function syntaxToSemanticValue(
  val: ColumnValue,
  keywords: Set<string>
): SemanticValue {
  if (typeof val === "string" && keywords.has(val.toUpperCase())) {
    switch (val.toUpperCase()) {
      case "DEFAULT": return { kind: "default" };
      case "NULL": return { kind: "null" };
    }
  }
  return { kind: "value", value: val };
}

export function toSemanticValues(
  values: ColumnValue[],
  keywords: Set<string>,
): SemanticValue[] {
  let semanticValues: SemanticValue[] = [];

  for (const value of values) {
    semanticValues.push(syntaxToSemanticValue(value, keywords));
  }

  return semanticValues;
}