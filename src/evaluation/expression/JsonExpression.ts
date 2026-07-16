import { Path } from "../../mapping/import/Path.js";
import { type ValueResolverContext } from "../../mapping/value/ValueResolverContext.js";
import { type ColumnValue } from "../../types/ColumnValue.js";
import { type Expression } from "./Expression.js";

export class JsonExpression
  implements Expression<ValueResolverContext, ColumnValue> {

  private readonly path: Path;

  constructor(
    public name: string,
  ) {
    this.path = Path.parse(name);
  }

  evaluate(context: ValueResolverContext): ColumnValue {
    const value = this.path.resolveFirst(context.source);

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
      `Expected '${this.name}' to contain a primitive JSON value.`
    );
  }
}