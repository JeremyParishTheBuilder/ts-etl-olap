import { PropertyPath } from "../../mapping/import/PropertyPath.js";
import { type ValueResolverContext } from "../../mapping/value/ValueResolverContext.js";
import { type ColumnValue } from "../../types/ColumnValue.js";
import { type Expression } from "./Expression.js";

export class ValueExpression implements Expression<
  ValueResolverContext,
  ColumnValue
> {
  private readonly path: PropertyPath;

  constructor(public name: string) {
    this.path = PropertyPath.parse(name);
  }

  evaluate(context: ValueResolverContext): ColumnValue {
    const value = this.path.resolve(context.current);

    if (value === undefined) {
      return null;
    }

    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return value;
    }

    throw new Error(
      `Expected '${this.name}' to contain a primitive JSON value.`,
    );
  }
}
