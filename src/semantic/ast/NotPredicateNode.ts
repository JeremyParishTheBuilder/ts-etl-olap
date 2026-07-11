import { 
  type PredicateNode,
  type ResolvedPredicateNode
} from "./PredicateNode.js";

export class NotPredicateNode {
  readonly kind = "not" as const;

  constructor(public inner: PredicateNode) {}
}

export class ResolvedNotPredicateNode {
  readonly kind = "not" as const;

  constructor(public inner: ResolvedPredicateNode) {}
}