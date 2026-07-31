import {
  type PredicateNode,
  type ResolvedPredicateNode,
} from "./PredicateNode.js";

export class OrPredicateNode {
  readonly kind = "or" as const;

  constructor(public predicates: PredicateNode[]) {}
}

export class ResolvedOrPredicateNode {
  readonly kind = "or" as const;

  constructor(public predicates: ResolvedPredicateNode[]) {}
}
