import type { QueryPlan } from "../../evaluation/plan/QueryPlan.js";
import type { RelationBinding } from "./RelationBinding.js";

export interface BoundRelation {
  plan: QueryPlan;
  relations: readonly RelationBinding[];
}
