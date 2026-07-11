import { 
  type PredicateNode,
  type ResolvedPredicateNode
} from "./PredicateNode.js";

export class AndPredicateNode {
  readonly kind = "and" as const;

  constructor(public predicates: PredicateNode[]) {}
}

export class ResolvedAndPredicateNode {
  readonly kind = "and" as const;

  constructor(public predicates: ResolvedPredicateNode[]) {}
}