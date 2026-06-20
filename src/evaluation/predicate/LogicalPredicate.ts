import { type PredicateNode, type Predicate } from "./Predicate.js";
import { type RowView } from "../../schema/RowView.js";

export class BinaryLogicalPredicateNode {
  readonly kind = "binaryLogical" as const;

  constructor(
    public left: PredicateNode,
    public right: PredicateNode,
    public operator: "and" | "or" | "xor"
  ) {}
}

export class BinaryLogicalPredicate implements Predicate {
  constructor(
    public left: Predicate,
    public right: Predicate,
    public operator: "and" | "or" | "xor"
  ) {}

  evaluate(row: RowView): boolean {
    switch (this.operator) {
      case "and":
        return this.left.evaluate(row) && this.right.evaluate(row);
      case "or":
        return this.left.evaluate(row) || this.right.evaluate(row);
      case "xor":
        return this.left.evaluate(row) !== this.right.evaluate(row);
      default:
        throw new Error(`Invalid logical operator`);
    }
  }
}

export class NotPredicateNode {
  readonly kind = "not" as const;

  constructor(public inner: PredicateNode) {}
}

export class NotPredicate implements Predicate {
  constructor(public inner: Predicate) {}

  evaluate(row: RowView): boolean {
    return !this.inner.evaluate(row);
  }
}