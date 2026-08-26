import type { JsonValuePath } from "../../mapping/import/JsonValuePath.js";
import type { CaptureValue } from "../../mapping/value/CaptureValue.js";
import { ExpressionNode } from "./ExpressionNode.js";

export class JsonValueExpressionNode extends ExpressionNode {
  readonly kind = "json_value" as const;

  constructor(
    public readonly source: ExpressionNode | CaptureValue,
    public readonly path: JsonValuePath,
  ) {
    super();
  }
}
