import { captureScalar } from "../../dsl/expression/functions.js";
import type { CaptureContext } from "../../mapping/discovery/CaptureContext.js";
import { Path } from "../../mapping/import/Path.js";
import type { CaptureValue } from "../../mapping/value/CaptureValue.js";
import { isColumnValue } from "../../types/ColumnValue.js";
import { CaptureScalarExpression } from "./CaptureScalarExpression.js";
import type { Expression } from "./Expression.js";
import { JsonExpression } from "./JsonExpression.js";

export class CaptureExpression
  implements Expression<CaptureContext, CaptureValue> {

  constructor(
    readonly name: string
  ) {}

  evaluate(
    context: CaptureContext
  ): CaptureValue {
    return context.captures.get(
      this.name
    ) ?? null;
  }
}

// export class CaptureExpression
//   implements Expression<CaptureContext, CaptureValue> {

//   private readonly path: Path;

//   constructor(
//     readonly name: string
//   ) {
//     this.path = Path.parse(name);
//   }

//   evaluate(context: CaptureContext): CaptureValue {
//     const [root, ...rest] = this.path.identityParts();

//     const captured = context.captures.get(root);

//     if (captured === undefined) {
//       return null;
//     }

//     if (rest.length === 0) {
//       return isColumnValue(captured)
//         ? captured
//         : null;
//     }

//     return new Path(rest).resolveFirst(captured); // error
//   }
// }