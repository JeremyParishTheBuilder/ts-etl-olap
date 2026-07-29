import { type ColumnValue } from "../../types/ColumnValue.js";
import { CaptureScalarExpression } from "../../evaluation/expression/CaptureScalarExpression.js";
import { LiteralExpression } from "../../evaluation/expression/LiteralExpression.js";
import { ConcatExpression } from "../../evaluation/expression/ConcatExpression.js";
import { BasenameExpression } from "../../evaluation/expression/BasenameExpression.js";
import {
  type CaseBranch,
  CaseExpression,
} from "../../evaluation/expression/CaseExpression.js";
import { type Expression } from "../../evaluation/expression/Expression.js";
import { PropertyNameExpression } from "../../evaluation/expression/PropertyNameExpression.js";
import { CurrentValueExpression } from "../../evaluation/expression/CurrentValueExpression.js";
import type { DiscoveryContext } from "../../mapping/discovery/DiscoveryContext.js";
import type { DiscoveryValue } from "../../mapping/value/DiscoveryValue.js";
import { ScalarExpressionBuilder } from "./ScalarExpressionBuilder.js";
import { CaptureExpression } from "../../evaluation/expression/CaptureExpression.js";
import type { CaptureContext } from "../../mapping/discovery/CaptureContext.js";
import type { CaptureValue } from "../../mapping/value/CaptureValue.js";
import { ValueExpressionBuilder } from "./ValueExpressionBuilder.js";

export function case_<TContext>(
  branches: CaseBranch<TContext>[],
  elseExpr: Expression<TContext>,
) {
  return new ScalarExpressionBuilder(new CaseExpression(branches, elseExpr));
}

export function value(path: string) {
  return current().path(path).scalar();
}

export function literal(value: ColumnValue) {
  return new ScalarExpressionBuilder(new LiteralExpression(value));
}

export function basename() {
  return new ScalarExpressionBuilder(new BasenameExpression());
}

export function propertyName() {
  return new ScalarExpressionBuilder(new PropertyNameExpression());
}

export function concat<TContext>(
  ...parts: ScalarExpressionBuilder<TContext>[]
) {
  return new ScalarExpressionBuilder(
    new ConcatExpression(parts.map((p) => p.expression)),
  );
}

export function current() {
  return new ValueExpressionBuilder<DiscoveryContext, DiscoveryValue>(
    new CurrentValueExpression(),
  );
}

export function captureScalar(name: string) {
  return new ScalarExpressionBuilder(new CaptureScalarExpression(name));
}

export function capture<TContext extends CaptureContext>(
  name: string,
): ValueExpressionBuilder<TContext, CaptureValue> {
  return new ValueExpressionBuilder(new CaptureExpression<TContext>(name));
}

// export function path(
//   path: string
// ) {
//   return new DiscoveryExpressionBuilder(
//     new PathExpression(
//       new SourceExpression(),
//       PropertyPath.parse(path)
//     )
//   );
// }
