import { type Action } from "../actions/Action.js";
import { type QueryPlan } from "../evaluation/plan/QueryPlan.js";

export type BindResult =
  | { kind: "actions"; actions: Action[] }
  | { kind: "query"; plan: QueryPlan };