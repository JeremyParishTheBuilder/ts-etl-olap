import type { CaptureContext } from "../../mapping/discovery/CaptureContext.js";
import type { CaptureValue } from "../../mapping/value/CaptureValue.js";
import type { Expression } from "./Expression.js";

export class CaptureExpression<
  TContext extends CaptureContext,
> implements Expression<TContext, CaptureValue> {
  constructor(readonly name: string) {}

  evaluate(context: TContext): CaptureValue {
    return context.captures.get(this.name) ?? null;
  }

  consumedKeys?(): readonly string[];
}
