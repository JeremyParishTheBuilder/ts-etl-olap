import { type ExpressionNode } from "../../evaluation/expression/Expression.js";
import { type PredicateNode } from "../../evaluation/predicate/Predicate.js";

export type CaseBranch = {
  when: PredicateNode;
  then: ExpressionNode;
};