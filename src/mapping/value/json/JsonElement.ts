import type { JsonValue } from "./JsonValue.js";

export interface JsonElement {
  index: number;
  value: JsonValue;
}