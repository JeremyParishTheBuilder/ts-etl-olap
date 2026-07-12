import { CaseExpressionNode } from "./CaseExpressionNode.js";
import { type ExpressionNode } from "../../../evaluation/expression/Expression.js";
import {
  type PredicateNode
} from "../predicate/PredicateNode.js";
import { WhenBuilder } from "./WhenBuilder.js";
import { type CaseBranchNode } from "./CaseBranchNode.js";
import { type ExplicitInput } from "../../../types/ExplicitInput.js";
import { asExpressionNode } from "../../../dsl/expression/asExpressionNode.js";

export class CaseBuilder {
  private branches: CaseBranchNode[] = [];

  when(predicate: PredicateNode) {
    return new WhenBuilder(
      this,
      predicate,
    );
  }

  addBranch(branch: CaseBranchNode) {
    this.branches.push(branch);
  }

  else(expr: ExpressionNode | ExplicitInput) {
    return new CaseExpressionNode(
      this.branches,
      asExpressionNode(expr),
    );
  }
}