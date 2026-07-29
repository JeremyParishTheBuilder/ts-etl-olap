import { type Predicate } from "./Predicate.js";

export class XorPredicate<TContext> implements Predicate<TContext> {
  constructor(
    public left: Predicate<TContext>,
    public right: Predicate<TContext>,
  ) {}

  evaluate(context: TContext): boolean {
    return this.left.evaluate(context) !== this.right.evaluate(context);
  }
}
