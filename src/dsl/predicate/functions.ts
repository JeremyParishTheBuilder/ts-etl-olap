import { AndPredicate } from "../../evaluation/predicate/AndPredicate.js";
import { IsDirectoryPredicate } from "../../evaluation/predicate/IsDirectoryPredicate.js";
import { IsFilePredicate } from "../../evaluation/predicate/IsFilePredicate.js";
import { NotPredicate } from "../../evaluation/predicate/NotPredicate.js";
import { OrPredicate } from "../../evaluation/predicate/OrPredicate.js";
import { XorPredicate } from "../../evaluation/predicate/XorPredicate.js";
import { type FsObject } from "../../mapping/discovery/FsObject.js";
import { PredicateBuilder } from "./PredicateBuilder.js";

export function every<TContext>(
  ...predicates: PredicateBuilder<TContext>[]
) {
  return new PredicateBuilder(
    new AndPredicate(
      predicates.map(
        p => p.predicate
      )
    )
  );
}

export function some<TContext>(
  ...predicates: PredicateBuilder<TContext>[]
) {
  return new PredicateBuilder(
    new OrPredicate(
      predicates.map(
        p => p.predicate
      )
    )
  );
}

export function not<TContext>(
  predicate: PredicateBuilder<TContext>
) {
  return new PredicateBuilder(
    new NotPredicate(
      predicate.predicate
    )
  );
}

export function xor<TContext>(
  left: PredicateBuilder<TContext>,
  right: PredicateBuilder<TContext>
) {
  return new PredicateBuilder(
    new XorPredicate(
      left,
      right
    )
  );
}

export function isDirectory() {
  return new PredicateBuilder<FsObject>(
    new IsDirectoryPredicate()
  );
}

export function isFile() {
  return new PredicateBuilder<FsObject>(
    new IsFilePredicate()
  );
}