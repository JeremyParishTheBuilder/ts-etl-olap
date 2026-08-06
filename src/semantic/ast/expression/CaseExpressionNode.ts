import {
  type ExpressionNode,
  type ResolvedExpressionNode,
} from "./ExpressionNode.js";
import {
  type PredicateNode,
  type ResolvedPredicateNode,
} from "../predicate/PredicateNode.js";
import { ExpressionNodeBase } from "./ExpressionNodeBase.js";
import { asExpressionNode } from "./asExpressionNode.js";
import type { ColumnValue } from "../../../types/ColumnValue.js";

export class CaseExpressionNode extends ExpressionNodeBase {
  readonly kind = "case" as const;
  public readonly elseExpr?: ExpressionNode;

  constructor(
    public readonly branches: Array<{
      when: PredicateNode;
      then: ExpressionNode;
    }>,
    elseExpr?: ExpressionNode | ColumnValue,
  ) {
    super();
    this.elseExpr = elseExpr ? asExpressionNode(elseExpr) : undefined;
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
