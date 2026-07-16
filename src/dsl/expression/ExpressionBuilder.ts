import { BinaryExpression } from "../../evaluation/expression/BinaryExpression.js";
import { CaptureScalarExpression } from "../../evaluation/expression/CaptureScalarExpression.js";
import { type Expression } from "../../evaluation/expression/Expression.js";
import { LiteralExpression } from "../../evaluation/expression/LiteralExpression.js";
import { PathExpression } from "../../evaluation/expression/PathExpression.js";
import { ComparisonPredicate } from "../../evaluation/predicate/ComparisonPredicate.js";
import { Path } from "../../mapping/import/Path.js";
import type { CaptureValue } from "../../mapping/value/CaptureValue.js";
import { type ColumnValue } from "../../types/ColumnValue.js";
import { PredicateBuilder } from "../predicate/PredicateBuilder.js";
import { ScalarExpressionBuilder } from "./ScalarExpressionBuilder.js";

export class ExpressionBuilder<TContext, TResult = ColumnValue> {
  constructor(
    readonly expression: Expression<TContext, TResult>
  ) {}

  evaluate(context: TContext): TResult {
    return this.expression.evaluate(context);
  }
}

  // private unwrap(
  //   value: ExpressionBuilder<TContext, ColumnValue> | ColumnValue
  // ): Expression<TContext> {
  //   if (value instanceof ExpressionBuilder) {
  //       return value.expression;
  //   }

  //   return new LiteralExpression(value);
  // }

  // eq(
  //   rhs: ExpressionBuilder<TContext> | ColumnValue
  // ) {
  //   return new PredicateBuilder<TContext>(
  //     new ComparisonPredicate(
  //       this.expression, // error:
  //       "eq",
  //       this.unwrap(rhs)
  //     )
  //   );
  // }

  // ne(
  //   rhs: ExpressionBuilder<TContext> | ColumnValue
  // ) {
  //   return new PredicateBuilder<TContext>(
  //     new ComparisonPredicate(
  //       this.expression,
  //       "ne",
  //       this.unwrap(rhs)
  //     )
  //   );
  // }

  // gt(
  //   rhs: ExpressionBuilder<TContext> | ColumnValue
  // ) {
  //   return new PredicateBuilder<TContext>(
  //     new ComparisonPredicate(
  //       this.expression,
  //       "gt",
  //       this.unwrap(rhs)
  //     )
  //   );
  // }

  // gte(
  //   rhs: ExpressionBuilder<TContext> | ColumnValue
  // ) {
  //   return new PredicateBuilder<TContext>(
  //     new ComparisonPredicate(
  //       this.expression,
  //       "gte",
  //       this.unwrap(rhs)
  //     )
  //   );
  // }

  // lt(
  //   rhs: ExpressionBuilder<TContext> | ColumnValue
  // ) {
  //   return new PredicateBuilder<TContext>(
  //     new ComparisonPredicate(
  //       this.expression,
  //       "lt",
  //       this.unwrap(rhs)
  //     )
  //   );
  // }

  // lte(
  //   rhs: ExpressionBuilder<TContext> | ColumnValue
  // ) {
  //   return new PredicateBuilder<TContext>(
  //     new ComparisonPredicate(
  //       this.expression,
  //       "lte",
  //       this.unwrap(rhs)
  //     )
  //   );
  // }

  // add(
  //   rhs: ExpressionBuilder<TContext> | ColumnValue
  // ) {
  //   return new ExpressionBuilder(
  //     new BinaryExpression(
  //       this.expression,
  //       "add",
  //       this.unwrap(rhs)
  //     )
  //   );
  // }

  // subtract(
  //   rhs: ExpressionBuilder<TContext> | ColumnValue
  // ) {
  //   return new ExpressionBuilder(
  //     new BinaryExpression(
  //       this.expression,
  //       "subtract",
  //       this.unwrap(rhs)
  //     )
  //   );
  // }

  // multiply(
  //   rhs: ExpressionBuilder<TContext> | ColumnValue
  // ) {
  //   return new ExpressionBuilder(
  //     new BinaryExpression(
  //       this.expression,
  //       "multiply",
  //       this.unwrap(rhs)
  //     )
  //   );
  // }

  // divide(
  //   rhs: ExpressionBuilder<TContext> | ColumnValue
  // ) {
  //   return new ExpressionBuilder(
  //     new BinaryExpression(
  //       this.expression,
  //       "divide",
  //       this.unwrap(rhs)
  //     )
  //   );
  // }

  // mod(
  //   rhs: ExpressionBuilder<TContext> | ColumnValue
  // ) {
  //   return new ExpressionBuilder(
  //     new BinaryExpression(
  //       this.expression,
  //       "mod",
  //       this.unwrap(rhs)
  //     )
  //   );
  // }
//}