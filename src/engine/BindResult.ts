import { type Action } from "../actions/Action";
import { type QueryPlan } from "../query/plan/QueryPlan";

export type BindResult =
  | { kind: "actions"; actions: Action[] }
  | { kind: "query"; plan: QueryPlan };