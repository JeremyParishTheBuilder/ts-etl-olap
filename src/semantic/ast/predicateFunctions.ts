import { BinaryLogicalPredicateNode } from "../../evaluation/predicate/LogicalPredicate.js";
import { NotPredicateNode } from "./NotPredicateNode.js";
import { type PredicateNode } from "./PredicateNode.js";

export function and(left: PredicateNode, right: PredicateNode) {
  return new BinaryLogicalPredicateNode(
    left,
    right,
    "and",
  );
}

export function or(left: PredicateNode, right: PredicateNode) {   
  return new BinaryLogicalPredicateNode(
    left,
    right,
    "or",
  );
}

export function xor(left: PredicateNode, right: PredicateNode) {   
  return new BinaryLogicalPredicateNode(
    left,
    right,
    "xor",
  );
}

export function not(inner: PredicateNode) {   
  return new NotPredicateNode(
    inner,
  );
}