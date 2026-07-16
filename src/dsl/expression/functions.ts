import { type ColumnValue } from "../../types/ColumnValue.js";
import { CaptureScalarExpression } from "../../evaluation/expression/CaptureScalarExpression.js";
import { JsonExpression } from "../../evaluation/expression/JsonExpression.js";
import { LiteralExpression } from "../../evaluation/expression/LiteralExpression.js";
import { ConcatExpression } from "../../evaluation/expression/ConcatExpression.js";
import { DirectoryNameExpression } from "../../evaluation/expression/DirectoryNameExpression.js";
import { ExpressionBuilder } from "./ExpressionBuilder.js";
import { BasenameExpression } from "../../evaluation/expression/BasenameExpression.js";
import {
  type CaseBranch,
  CaseExpression
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
import { DiscoveryExpressionBuilder } from "./DiscoveryExpressionBuilder.js";
//import { CaptureObjectExpression } from "../../evaluation/expression/CaptureObjectExpression.js";
// import { CaptureContext } from "../../mapping/value/CaptureContext.js";
// import { JsonValue } from "../../mapping/value/JsonValue.js";

export function case_<TContext>(
  branches: CaseBranch<TContext>[],
  elseExpr: Expression<TContext>
) {
  return new ScalarExpressionBuilder(
    new CaseExpression(branches, elseExpr)
  );
}

export function json(
  name: string
) {
  return new ScalarExpressionBuilder(
    new JsonExpression(name)
  );
}

export function literal(
  value: ColumnValue
) {
  return new ScalarExpressionBuilder(
    new LiteralExpression(value)
  );
}

export function directoryName() {
  return new ScalarExpressionBuilder(
    new DirectoryNameExpression()
  );
}

export function propertyName() {
  return new ScalarExpressionBuilder(
    new PropertyNameExpression()
  );
}

export function basename() {
  return new ScalarExpressionBuilder(
    new BasenameExpression()
  );
}

export function concat<TContext>(
  ...parts: ScalarExpressionBuilder<TContext>[]
) {
  return new ScalarExpressionBuilder(
    new ConcatExpression(
      parts.map(p => p.expression)
    )
  );
}

export function current() {
  return new ExpressionBuilder<DiscoveryContext, DiscoveryValue>(
    new CurrentValueExpression()
  );
}

export function captureScalar(
  name: string
) {
  return new ScalarExpressionBuilder(
    new CaptureScalarExpression(name)
  );
}

export function capture(
  name: string
) {
  return new DiscoveryExpressionBuilder(
    new CaptureExpression(name)
  );
}

// export function captureObject(
//   name: string
// ) {
//   return new ExpressionBuilder(
//     new CaptureObjectExpression(name)
//   );
// }