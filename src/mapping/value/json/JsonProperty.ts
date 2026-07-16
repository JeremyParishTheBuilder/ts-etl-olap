import type { JsonValue } from "./JsonValue.js";

export interface JsonProperty {
  key: string;
  value: JsonValue;
}