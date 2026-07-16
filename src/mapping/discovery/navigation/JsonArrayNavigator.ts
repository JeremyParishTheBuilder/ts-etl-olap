import type { ColumnValue } from "../../../types/ColumnValue.js";
import type { JsonArray } from "../../value/json/JsonValue.js";
import type { DiscoveryValue } from "../../value/DiscoveryValue.js";
import type { DiscoveryNavigator } from "./DiscoveryNavigator.js";
import type { JsonElement } from "../../value/json/JsonElement.js";

export class JsonArrayNavigator
  implements DiscoveryNavigator<JsonArray, JsonElement> {

  accepts(current: DiscoveryValue): current is JsonArray {
    return Array.isArray(current);
  }

  next(json: JsonArray): readonly JsonElement[] {
    return json.map(
      (value, index) => ({
        index,
        value
      })
    );
  }

  identityParts(
    current: JsonArray,
    next: JsonElement
  ): readonly ColumnValue[] {
    return [next.index];
  }
}