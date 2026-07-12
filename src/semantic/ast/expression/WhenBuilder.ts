import { type ExpressionNode } from "../../../evaluation/expression/Expression.js";
import {
  type PredicateNode,
} from "../predicate/PredicateNode.js";
import { type ExplicitInput } from "../../../types/ExplicitInput.js";
import { asExpressionNode } from "../../../dsl/expression/asExpressionNode.js";
import { type CaseBranchNode } from "./CaseBranchNode.js";
import { type CaseBuilder } from "./CaseBuilder.js";

export class WhenBuilder {
  constructor(
    private caseBuilder: CaseBuilder,
    private predicate: PredicateNode,
  ) {}

  then(expr: ExpressionNode | ExplicitInput) {
    this.caseBuilder.addBranch(
      {
        when: this.predicate,
        then: asExpressionNode(expr),
      } as CaseBranchNode
    );

    return this.caseBuilder;
  }
}