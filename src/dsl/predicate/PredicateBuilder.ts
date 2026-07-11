import { type Predicate } from "../../evaluation/predicate/Predicate.js";

export class PredicateBuilder<TContext> {
  constructor(
    readonly predicate: Predicate<TContext>
  ) {}

  evaluate(context: TContext): boolean {
    return this.predicate.evaluate(context);
  }
}