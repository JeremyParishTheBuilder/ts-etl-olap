import { type ColumnValue } from "../../types/ColumnValue.js";
import {
  type Predicate,
} from "../predicate/Predicate.js";
import { type Expression } from "./Expression.js";

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