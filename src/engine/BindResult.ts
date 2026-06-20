import { type Action } from "../actions/Action";
import { type QueryPlan } from "../evaluation/plan/QueryPlan";

export type BindResult =
  | { kind: "actions"; actions: Action[] }
  | { kind: "query"; plan: QueryPlan };