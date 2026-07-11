import { type RowView } from "../../schema/RowView.js";

export interface Predicate<TContext = RowView> {
  evaluate(context: TContext): boolean;
}