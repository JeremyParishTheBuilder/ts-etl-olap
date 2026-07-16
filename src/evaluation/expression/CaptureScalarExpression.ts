import { type CaptureContext } from "../../mapping/discovery/CaptureContext.js";
import { type Expression } from "./Expression.js";
import { isColumnValue, type ColumnValue } from "../../types/ColumnValue.js";

export class CaptureScalarExpression<TContext extends CaptureContext>
  implements Expression<TContext, ColumnValue> {

  constructor(
    readonly name: string
  ) {}

  evaluate(context: TContext): ColumnValue {
    const value = context.captures.get(
      this.name
    );

    if (!isColumnValue(value)) {
      return null;
    }

    return value;
  }
}