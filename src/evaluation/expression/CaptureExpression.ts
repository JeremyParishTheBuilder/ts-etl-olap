import { type CaptureContext } from "../../mapping/value/CaptureContext.js";
import { type ColumnValue } from "../../types/ColumnValue.js";
import { type Expression } from "./Expression.js";

export class CaptureExpression<TContext extends CaptureContext>
  implements Expression<TContext, ColumnValue> {

  constructor(
    readonly name: string
  ) {}

  evaluate(context: TContext): ColumnValue {
    return context.captures.get(
      this.name
    ) ?? null;
  }
}