import type { Path } from "../../mapping/import/Path.js";
import type { CaptureValue } from "../../mapping/value/CaptureValue.js";
import { isColumnValue, type ColumnValue } from "../../types/ColumnValue.js";
import type { Expression } from "./Expression.js";

export class PathExpression<TContext>
  implements Expression<TContext, CaptureValue> {

  constructor(
    readonly source: Expression<TContext, CaptureValue>,
    readonly path: Path
  ) {}

  evaluate(
    context: TContext
  ): CaptureValue {
    return this.path.resolveFirst(
      this.source.evaluate(context)
    );
    // const root = this.source.evaluate(context);

    // const value = this.path.resolveFirst(root);

    // return value;
  }
}