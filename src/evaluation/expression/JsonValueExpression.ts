import type { JsonValuePath } from "../../mapping/import/JsonValuePath.js";
import type { CaptureValue } from "../../mapping/value/CaptureValue.js";
import { isStructuredValue } from "../../mapping/value/StructuredValue.js";
import { isColumnValue, type ColumnValue } from "../../types/ColumnValue.js";
import type { Expression } from "./Expression.js";

export class JsonValueExpression<TContext> implements Expression<
  TContext,
  ColumnValue
> {
  constructor(
    readonly source: Expression<TContext, CaptureValue>,
    public readonly path: JsonValuePath,
  ) {}

  evaluate(context: TContext): ColumnValue {
    const value = this.source.evaluate(context);

    if (!isStructuredValue(value)) {
      throw new Error("JSON_VALUE source must be a structured value.");
    }

    const result = this.path.resolve(value);

    if (result === undefined) {
      throw new Error(`JSON_VALUE path did not resolve: ${this.path}`);
    }

    if (!isColumnValue(result)) {
      throw new Error("JSON_VALUE result must be a scalar value.");
    }

    return result;
  }
}
