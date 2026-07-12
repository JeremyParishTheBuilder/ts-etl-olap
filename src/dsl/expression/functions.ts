import { type ColumnValue } from "../../types/ColumnValue.js";
import { CaptureExpression } from "../../evaluation/expression/CaptureExpression.js";
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

export function case_<TContext>(
  branches: CaseBranch<TContext>[],
  elseExpr: Expression<TContext>
) {
  return new ExpressionBuilder(
    new CaseExpression(branches, elseExpr)
  );
}

export function json(
  name: string
) {
  return new ExpressionBuilder(
    new JsonExpression(name)
  );
}

export function capture(
  name: string
) {
  return new ExpressionBuilder(
    new CaptureExpression(name)
  );
}

export function literal(
  value: ColumnValue
) {
  return new ExpressionBuilder(
    new LiteralExpression(value)
  );
}

export function directoryName() {
  return new ExpressionBuilder(
    new DirectoryNameExpression()
  );
}

export function basename() {
  return new ExpressionBuilder(
    new BasenameExpression()
  );
}

export function concat<TContext>(
  ...parts: ExpressionBuilder<TContext>[]
) {
  return new ExpressionBuilder(
    new ConcatExpression(
      parts.map(p => p.expression)
    )
  );
}