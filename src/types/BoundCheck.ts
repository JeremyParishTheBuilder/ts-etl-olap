import { type Predicate } from "../evaluation/predicate/Predicate.js";
import { type CheckId } from "../relational/Check.js";

export type BoundCheck = {
  id: CheckId;
  predicate: Predicate;
};
