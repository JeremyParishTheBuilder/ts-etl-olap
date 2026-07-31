import { type Expression } from "../expression/Expression.js";
import { type Predicate } from "./Predicate.js";

export class IsNotNullPredicate<TContext> implements Predicate<TContext> {
  constructor(public inner: Expression<TContext>) {}

  evaluate(context: TContext): boolean {
    return this.inner.evaluate(context) !== null;
  }
}
