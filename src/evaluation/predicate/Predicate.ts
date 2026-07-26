import { type RowView } from "../../relational/RowView.js";

export interface Predicate<TContext = RowView> {
  evaluate(context: TContext): boolean;
}