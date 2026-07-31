import { type Predicate } from "./Predicate.js";

export class NotPredicate<TContext> implements Predicate<TContext> {
  constructor(public inner: Predicate<TContext>) {}

  evaluate(context: TContext): boolean {
    return !this.inner.evaluate(context);
  }
}
