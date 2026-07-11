import { CaseExpressionNode } from "../../evaluation/expression/CaseExpression.js";
import { type ExpressionNode } from "../../evaluation/expression/Expression.js";
import {
  type PredicateNode
} from "../../semantic/ast/PredicateNode.js";
import { WhenBuilder } from "./WhenBuilder.js";
import { type CaseBranch } from "./CaseBranch.js";
import { type ExplicitInput } from "../../types/ExplicitInput.js";
import { asExpressionNode } from "../expression/asExpressionNode.js";

export class CaseBuilder {
  private branches: CaseBranch[] = [];

  when(predicate: PredicateNode) {
    return new WhenBuilder(
      this,
      predicate,
    );
  }

  addBranch(branch: CaseBranch) {
    this.branches.push(branch);
  }

  else(expr: ExpressionNode | ExplicitInput) {
    return new CaseExpressionNode(
      this.branches,
      asExpressionNode(expr),
    );
  }
}