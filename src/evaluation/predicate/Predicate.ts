import { type RowView } from "../../schema/RowView.js";
import { type ComparisonPredicateNode } from "./ComparisonPredicate.js";
import { BinaryLogicalPredicateNode, NotPredicateNode } from "./LogicalPredicate.js";

export interface Predicate {
  evaluate(row: RowView): boolean;
}

export type PredicateNode =
  | ComparisonPredicateNode
  | BinaryLogicalPredicateNode
  | NotPredicateNode;