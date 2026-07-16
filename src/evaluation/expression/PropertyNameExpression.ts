import type { JsonProperty } from "../../mapping/value/json/JsonProperty.js";
import { type Expression } from "./Expression.js";

export class PropertyNameExpression
  implements Expression<JsonProperty, string> {

  evaluate(
    context: JsonProperty
  ): string {
    return context.key;
  }
}