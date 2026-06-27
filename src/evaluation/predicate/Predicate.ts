import { type RowView } from "../../schema/RowView.js";
import {
  type ResolvedComparisonPredicateNode,
  type ComparisonPredicateNode
} from "./ComparisonPredicate.js";
import {
  type ResolvedBinaryLogicalPredicateNode,
  type ResolvedNotPredicateNode,
  type BinaryLogicalPredicateNode,
  type NotPredicateNode
} from "./LogicalPredicate.js";

export interface Predicate {
  evaluate(row: RowView): boolean;
}

export type ResolvedPredicateNode =
  | ResolvedComparisonPredicateNode
  | ResolvedBinaryLogicalPredicateNode
  | ResolvedNotPredicateNode;

export type PredicateNode =
  | ComparisonPredicateNode
  | BinaryLogicalPredicateNode
  | NotPredicateNode;