import { type PlanNode } from "./PlanNode.js";

export interface QueryPlan {
  root: PlanNode;
}