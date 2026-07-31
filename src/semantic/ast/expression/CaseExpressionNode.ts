import {
  type ExpressionNode,
  type ResolvedExpressionNode,
  ExpressionNodeBase,
} from "../../../evaluation/expression/Expression.js";
import {
  type PredicateNode,
  type ResolvedPredicateNode,
} from "../predicate/PredicateNode.js";

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
