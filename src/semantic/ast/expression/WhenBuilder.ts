import { type PredicateNode } from "../predicate/PredicateNode.js";
import { type CaseBranchNode } from "./CaseBranchNode.js";
import { type CaseBuilder } from "./CaseBuilder.js";
import { asExpressionNode } from "./asExpressionNode.js";
import type { ExpressionNode } from "./ExpressionNode.js";
import type { ColumnValue } from "../../../types/ColumnValue.js";

export class WhenBuilder {
  constructor(
    private caseBuilder: CaseBuilder,
    private predicate: PredicateNode,
  ) {}

  then(expr: ExpressionNode | ColumnValue) {
    this.caseBuilder.addBranch({
      when: this.predicate,
      then: asExpressionNode(expr),
    } as CaseBranchNode);

    return this.caseBuilder;
  }
}
