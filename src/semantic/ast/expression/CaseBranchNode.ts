import { type ExpressionNode } from "../../../evaluation/expression/Expression.js";
import {
  type PredicateNode
} from "../predicate/PredicateNode.js";

export type CaseBranchNode = {
  when: PredicateNode;
  then: ExpressionNode;
};