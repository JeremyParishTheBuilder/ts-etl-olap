import { type Predicate } from "./Predicate.js";

export class OrPredicate<TContext>
  implements Predicate<TContext> {

  constructor(
    readonly predicates: readonly Predicate<TContext>[]
  ) {}

  evaluate(
    context: TContext
  ) {
    return this.predicates.some(
      p => p.evaluate(context)
    );
  }
}