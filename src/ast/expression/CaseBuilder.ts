import { CaseExpressionNode } from "./CaseExpressionNode.js";
import { type PredicateNode } from "../predicate/PredicateNode.js";
import { WhenBuilder } from "./WhenBuilder.js";
import { type CaseBranchNode } from "./CaseBranchNode.js";
import type { ColumnValue } from "../../types/ColumnValue.js";
import type { ExpressionNode } from "./ExpressionNode.js";

export class CaseBuilder {
  private branches: CaseBranchNode[] = [];

  when(predicate: PredicateNode) {
    return new WhenBuilder(this, predicate);
  }

  addBranch(branch: CaseBranchNode) {
    this.branches.push(branch);
  }

  else(expr: ExpressionNode | ColumnValue) {
    return new CaseExpressionNode(this.branches, expr);
  }
}
