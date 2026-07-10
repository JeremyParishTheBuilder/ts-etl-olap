import { BinaryExpression } from "../../evaluation/expression/BinaryExpression.js";
import { type Expression } from "../../evaluation/expression/Expression.js";
import { LiteralExpression } from "../../evaluation/expression/LiteralExpression.js";
import { ComparisonPredicate } from "../../evaluation/predicate/ComparisonPredicate.js";
import { type ColumnValue } from "../../types/ColumnValue.js";

export class ExpressionBuilder<TContext> {
  constructor(
    readonly expression: Expression<TContext>
  ) {}

  evaluate(context: TContext) {
    return this.expression.evaluate(context);
  }

  private unwrap(
    value: ExpressionBuilder<TContext> | ColumnValue
  ): Expression<TContext> {
    if (value instanceof ExpressionBuilder) {
        return value.expression;
    }

    return new LiteralExpression(value);
  }

  eq(
    rhs: ExpressionBuilder<TContext> | ColumnValue
  ) {
    return new ComparisonPredicate(
      this.expression,
      "eq",
      this.unwrap(rhs)
    );
  }

  ne(
    rhs: ExpressionBuilder<TContext> | ColumnValue
  ) {
    return new ComparisonPredicate(
      this.expression,
      "ne",
      this.unwrap(rhs)
    );
  }

  gt(
    rhs: ExpressionBuilder<TContext> | ColumnValue
  ) {
    return new ComparisonPredicate(
      this.expression,
      "gt",
      this.unwrap(rhs)
    );
  }

  gte(
    rhs: ExpressionBuilder<TContext> | ColumnValue
  ) {
    return new ComparisonPredicate(
      this.expression,
      "gte",
      this.unwrap(rhs)
    );
  }

  lt(
    rhs: ExpressionBuilder<TContext> | ColumnValue
  ) {
    return new ComparisonPredicate(
      this.expression,
      "lt",
      this.unwrap(rhs)
    );
  }

  lte(
    rhs: ExpressionBuilder<TContext> | ColumnValue
  ) {
    return new ComparisonPredicate(
      this.expression,
      "lte",
      this.unwrap(rhs)
    );
  }

  add(
    rhs: ExpressionBuilder<TContext> | ColumnValue
  ) {
    return new ExpressionBuilder(
      new BinaryExpression(
        this.expression,
        "add",
        this.unwrap(rhs)
      )
    );
  }

  subtract(
    rhs: ExpressionBuilder<TContext> | ColumnValue
  ) {
    return new ExpressionBuilder(
      new BinaryExpression(
        this.expression,
        "subtract",
        this.unwrap(rhs)
      )
    );
  }

  multiply(
    rhs: ExpressionBuilder<TContext> | ColumnValue
  ) {
    return new ExpressionBuilder(
      new BinaryExpression(
        this.expression,
        "multiply",
        this.unwrap(rhs)
      )
    );
  }

  divide(
    rhs: ExpressionBuilder<TContext> | ColumnValue
  ) {
    return new ExpressionBuilder(
      new BinaryExpression(
        this.expression,
        "divide",
        this.unwrap(rhs)
      )
    );
  }

  mod(
    rhs: ExpressionBuilder<TContext> | ColumnValue
  ) {
    return new ExpressionBuilder(
      new BinaryExpression(
        this.expression,
        "mod",
        this.unwrap(rhs)
      )
    );
  }
}