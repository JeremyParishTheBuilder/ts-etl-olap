import { ContainsMatcher } from "../../mapping/matcher/ContainsMatcher.js";
import { type FsObject } from "../../mapping/discovery/FsObject.js";
import { type PredicateMatcher } from "../../mapping/matcher/PredicateMatcher.js";
import { type PredicateBuilder } from "../predicate/PredicateBuilder.js";

export function contains(predicate: PredicateBuilder<FsObject>): PredicateMatcher {
  return new ContainsMatcher(predicate);
}