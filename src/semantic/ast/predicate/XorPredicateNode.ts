import {
  type PredicateNode,
  type ResolvedPredicateNode,
} from "./PredicateNode.js";

export class XorPredicateNode {
  readonly kind = "xor" as const;

  constructor(
    public left: PredicateNode,
    public right: PredicateNode,
  ) {}
}

export class ResolvedXorPredicateNode {
  readonly kind = "xor" as const;

  constructor(
    public left: ResolvedPredicateNode,
    public right: ResolvedPredicateNode,
  ) {}
}
