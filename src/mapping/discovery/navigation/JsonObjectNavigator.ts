import type { ColumnValue } from "../../../types/ColumnValue.js";
import { type DiscoveryNavigator } from "./DiscoveryNavigator.js";
import type { DiscoveryValue } from "../../value/DiscoveryValue.js";
import type { JsonObject } from "../../value/json/JsonValue.js";
import type { JsonProperty } from "../../value/json/JsonProperty.js";

export class JsonObjectNavigator
  implements DiscoveryNavigator<JsonObject, JsonProperty> {

  accepts(value: DiscoveryValue): value is JsonObject {
  return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  }

  next(json: JsonObject): readonly JsonProperty[] {
    return Object.entries(json).map(
      ([key, value]) => ({
        key,
        value
      })
    );
  }

  identityParts(
    current: JsonObject,
    next: JsonProperty
  ): readonly ColumnValue[] {
    return [next.key];
  }
}