import { ValueResolverContext } from "../../mapping/value/ValueResolverContext.js";
import { type ColumnValue } from "../../types/ColumnValue.js";
import { type Expression } from "./Expression.js";

export class JsonExpression
  implements Expression<ValueResolverContext, ColumnValue> {

  constructor(
    public name: string,
  ) {}

  evaluate(context: ValueResolverContext): ColumnValue {
    const source = context.source;

    if (
      source === null ||
      typeof source !== "object" ||
      Array.isArray(source)
    ) {
      return null;
    }

    const value = source[this.name];

    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return value;
    }

    throw new Error(
      `Expected '${this.name}' to contain a primitive JSON value.`
    );
  }
}