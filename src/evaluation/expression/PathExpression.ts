import type { PropertyPath } from "../../mapping/import/PropertyPath.js";
import type { CaptureValue } from "../../mapping/value/CaptureValue.js";
import type { Expression } from "./Expression.js";

export class PathExpression<TContext>
  implements Expression<TContext, CaptureValue> {

  constructor(
    readonly source: Expression<TContext, CaptureValue>,
    readonly path: PropertyPath
  ) {}

  evaluate(
    context: TContext
  ): CaptureValue {
    return this.path.resolve(
      this.source.evaluate(context)
    );
  }

  //TODO remove
  // consumedKeys?(): readonly string[] {
  //   return this.path.parts.length > 0
  //     ? [this.path.parts[0]]
  //     : [];
  // }
}