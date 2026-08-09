import { type PredicateNode } from "../predicate/PredicateNode.js";
import type { ExpressionNode } from "./ExpressionNode.js";

export type CaseBranchNode = {
  when: PredicateNode;
  then: ExpressionNode;
};
