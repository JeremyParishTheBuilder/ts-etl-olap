import { type RowView } from "../../schema/RowView.js";

export interface PlanNode {
  execute(): IterableIterator<RowView>;
}