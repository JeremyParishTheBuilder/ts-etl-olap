import type { ImportContext } from "../../mapping/import/ImportContext.js";
import type { CaptureValue } from "../../mapping/value/CaptureValue.js";
import type { Expression } from "./Expression.js";

export class SourceExpression
  implements Expression<ImportContext, CaptureValue> {

  evaluate(
    context: ImportContext
  ): CaptureValue {
    return context.source;
  }
}