import { PathExpression } from "../../evaluation/expression/PathExpression.js";
import { ScalarCastExpression } from "../../evaluation/expression/ScalarCastExpression.js";
import { PropertyPath } from "../../mapping/import/PropertyPath.js";
import type { CaptureValue } from "../../mapping/value/CaptureValue.js";
import { ExpressionBuilder } from "./ExpressionBuilder.js";
import { ScalarExpressionBuilder } from "./ScalarExpressionBuilder.js";

export class DiscoveryExpressionBuilder<
  TContext,
  TValue extends CaptureValue
  > extends ExpressionBuilder<TContext, TValue> {

  path(path: string) {
    return new DiscoveryExpressionBuilder(
      new PathExpression(
        this.expression,
        PropertyPath.parse(path)
      )
    );
  }

  scalar() {
    return new ScalarExpressionBuilder(
      new ScalarCastExpression(
        this.expression
      )
    );
  }
}