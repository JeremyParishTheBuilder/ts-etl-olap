import { PredicateBuilder } from "../../dsl/predicate/PredicateBuilder.js";
import { type Predicate } from "../../evaluation/predicate/Predicate.js";
import { type FsObject } from "../discovery/FsObject.js";
import { type FsObjectMatcher } from "./FsObjectMatcher.js";

export class PredicateMatcher implements FsObjectMatcher {
  constructor(
    readonly predicate: Predicate<FsObject>
  ) {}

  matches(obj: FsObject): boolean {
    return this.predicate.evaluate(obj);
  }
}

export function asMatcher(
  matcher: FsObjectMatcher | PredicateBuilder<FsObject>
): FsObjectMatcher {
  if (matcher instanceof PredicateBuilder) {
      return new PredicateMatcher(matcher.predicate);
  }

  return matcher;
}