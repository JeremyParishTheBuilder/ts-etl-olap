import { type ColumnValue } from "../../schema/Column.js";
import { type RowView } from "../../schema/RowView.js";
import { type Predicate, type PredicateNode } from "../predicate/Predicate.js";
import { type Expression, type ExpressionNode } from "./Expression.js";

export class CaseExpressionNode {
  readonly kind = "case" as const;

  constructor(
    public readonly branches: Array<{
      when: PredicateNode;
      then: ExpressionNode;
    }>,
    public readonly elseExpr?: ExpressionNode,
  ) {}
}

export class CaseExpression {
  public constructor(
    public readonly branches: Array<{when: Predicate, then: Expression}>,
    public readonly elseExpr?: Expression,
  ) {}

  evaluate(row: RowView): ColumnValue {
    for (const branch of this.branches) {
      if (branch.when.evaluate(row)) {
        return branch.then.evaluate(row);
      }
    }

    return this.elseExpr?.evaluate(row) ?? null;
  }
}