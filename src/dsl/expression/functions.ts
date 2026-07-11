import { CaseBuilder } from "../case/CaseBuilder.js";
import { type ColumnValue } from "../../types/ColumnValue.js";
import { CaptureExpression } from "../../evaluation/expression/CaptureExpression.js";
import { JsonExpression } from "../../evaluation/expression/JsonExpression.js";
import { LiteralExpression } from "../../evaluation/expression/LiteralExpression.js";
import { ConcatExpression } from "../../evaluation/expression/ConcatExpression.js";
import { DirectoryNameExpression } from "../../evaluation/expression/DirectoryNameExpression.js";
import { ExpressionBuilder } from "./ExpressionBuilder.js";
import { BasenameExpression } from "../../evaluation/expression/BasenameExpression.js";

export function case_() {   
  return new CaseBuilder();
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