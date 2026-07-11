import { type Predicate } from "./Predicate.js";

export class AndPredicate<TContext>
  implements Predicate<TContext> {

  constructor(
    readonly predicates: readonly Predicate<TContext>[]
  ) {}

  evaluate(
    context: TContext
  ) {
    return this.predicates.every(
      p => p.evaluate(context)
    );
  }
}