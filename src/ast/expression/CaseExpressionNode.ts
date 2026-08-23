import {
  ExpressionNode,
  type ResolvedExpressionNode,
} from "./ExpressionNode.js";
import {
  type PredicateNode,
  type ResolvedPredicateNode,
} from "../predicate/PredicateNode.js";
import type { ColumnValue } from "../../types/ColumnValue.js";
import { BinaryExpressionMixin } from "./BinaryExpressionMixin.js";

export class CaseExpressionNode extends BinaryExpressionMixin(ExpressionNode) {
  readonly kind = "case" as const;
  public readonly elseExpr?: ExpressionNode | ColumnValue;

  constructor(
    public readonly branches: Array<{
      when: PredicateNode;
      then: ExpressionNode;
    }>,
    elseExpr?: ExpressionNode | ColumnValue,
  ) {
    super();
    this.elseExpr = elseExpr;
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
