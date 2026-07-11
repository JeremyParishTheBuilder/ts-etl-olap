import { type RowView } from "../../schema/RowView.js";
import {
  type ResolvedAndPredicateNode,
  type AndPredicateNode
} from "../../semantic/ast/AndPredicateNode.js";
import {
  type ResolvedOrPredicateNode,
  type OrPredicateNode
} from "../../semantic/ast/OrPredicateNode.js";
import {
  type ResolvedXorPredicateNode,
  type XorPredicateNode
} from "../../semantic/ast/XorPredicateNode.js";
import {
  type NotPredicateNode,
  type ResolvedNotPredicateNode
} from "../../semantic/ast/NotPredicateNode.js";
import {
  type ResolvedComparisonPredicateNode,
  type ComparisonPredicateNode
} from "./ComparisonPredicate.js";
import {
  type ResolvedBinaryLogicalPredicateNode,
  type BinaryLogicalPredicateNode,
} from "./LogicalPredicate.js";

export interface Predicate<TContext = RowView> {
  evaluate(context: TContext): boolean;
}

// export type ResolvedPredicateNode =
//   | ResolvedComparisonPredicateNode
//   | ResolvedBinaryLogicalPredicateNode
//   | ResolvedAndPredicateNode
//   | ResolvedOrPredicateNode
//   | ResolvedXorPredicateNode
//   | ResolvedNotPredicateNode;

// export type PredicateNode =
//   | ComparisonPredicateNode
//   | BinaryLogicalPredicateNode
//   | AndPredicateNode
//   | OrPredicateNode
//   | XorPredicateNode
//   | NotPredicateNode;