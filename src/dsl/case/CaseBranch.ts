import { type ExpressionNode } from "../../evaluation/expression/Expression.js";
import {
  type PredicateNode
} from "../../semantic/ast/PredicateNode.js";

export type CaseBranch = {
  when: PredicateNode;
  then: ExpressionNode;
};