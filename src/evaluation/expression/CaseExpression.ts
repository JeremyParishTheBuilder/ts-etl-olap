import { type ColumnValue } from "../../types/ColumnValue.js";
import { type RowView } from "../../schema/RowView.js";
import {
  type ResolvedPredicateNode,
  type Predicate,
  type PredicateNode
} from "../predicate/Predicate.js";
import {
  type ResolvedExpressionNode,
  type Expression,
  ExpressionNode,
  ExpressionNodeBase
} from "./Expression.js";

export class CaseExpressionNode extends ExpressionNodeBase {
  readonly kind = "case" as const;

  constructor(
    public readonly branches: Array<{
      when: PredicateNode;
      then: ExpressionNode;
    }>,
    public readonly elseExpr?: ExpressionNode,
  ) {
    super();
  }
}

export class ResolvedCaseExpressionNode {
  readonly kind = "case" as const;

  constructor(
    public readonly branches: Array<{
      when: ResolvedPredicateNode;
      then: ResolvedExpressionNode;
    }>,
    public readonly elseExpr?: ResolvedExpressionNode,
  ) {}
}

export class CaseExpression<TContext> implements Expression<TContext> {
  public constructor(
    public readonly branches: Array<{
      when: Predicate<TContext>,
      then: Expression<TContext>
    }>,
    public readonly elseExpr?: Expression<TContext>,
  ) {}

  evaluate(context: TContext): ColumnValue {
    for (const branch of this.branches) {
      if (branch.when.evaluate(context)) {
        return branch.then.evaluate(context);
      }
    }

    return this.elseExpr?.evaluate(context) ?? null;
  }
}