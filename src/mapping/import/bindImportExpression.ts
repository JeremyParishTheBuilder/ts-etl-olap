import type { ExpressionNode } from "../../ast/expression/ExpressionNode.js";
import { isExpressionNodeUnion } from "../../ast/expression/isExpressionNodeUnion.js";
import type { Expression } from "../../evaluation/expression/Expression.js";
import { JsonValueExpression } from "../../evaluation/expression/JsonValueExpression.js";
import { LiteralExpression } from "../../evaluation/expression/LiteralExpression.js";
import { SourceExpression } from "../../evaluation/expression/SourceExpression.js";
import { isColumnValue, type ColumnValue } from "../../types/ColumnValue.js";
import { isCaptureValue, type CaptureValue } from "../value/CaptureValue.js";
import type { ImportContext } from "./ImportContext.js";

export function bindImportExpression(
  expr: ExpressionNode | ColumnValue,
): Expression<ImportContext, ColumnValue> {
  if (isColumnValue(expr)) {
    return new LiteralExpression(expr);
  }

  if (!isExpressionNodeUnion(expr)) {
    throw new Error(`Unsupported expression node: ${expr.kind}`);
  }

  switch (expr.kind) {
    case "json_value":
      return new JsonValueExpression(
        bindImportSourceExpression(expr.source),
        expr.path,
      );

    default:
      throw new Error(
        `Invalid Expression Node Kind for Import Expression: ${expr.kind}`,
      );
  }
}

export function bindImportSourceExpression(
  expr: ExpressionNode | CaptureValue,
): Expression<ImportContext, CaptureValue> {
  if (isCaptureValue(expr)) {
    return new LiteralExpression(expr);
  }

  if (!isExpressionNodeUnion(expr)) {
    throw new Error(`Unsupported expression node: ${expr.kind}`);
  }

  switch (expr.kind) {
    case "source":
      return new SourceExpression();

    default:
      throw new Error(
        `Invalid Expression Node Kind for Import Source: ${expr.kind}`,
      );
  }
}
