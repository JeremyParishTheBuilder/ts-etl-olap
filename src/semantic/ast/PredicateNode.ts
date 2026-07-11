import {
  type ResolvedAndPredicateNode,
  type AndPredicateNode
} from "./AndPredicateNode.js";
import {
  type ResolvedOrPredicateNode,
  type OrPredicateNode
} from "./OrPredicateNode.js";
import {
  type ResolvedXorPredicateNode,
  type XorPredicateNode
} from "./XorPredicateNode.js";
import {
  type NotPredicateNode,
  type ResolvedNotPredicateNode
} from "./NotPredicateNode.js";
import { BinaryLogicalPredicateNode, ResolvedBinaryLogicalPredicateNode } from "../../evaluation/predicate/LogicalPredicate";
import { 
  type ComparisonPredicateNode,
  type ResolvedComparisonPredicateNode
} from "../../evaluation/predicate/ComparisonPredicate";

export type ResolvedPredicateNode =
  | ResolvedComparisonPredicateNode
  | ResolvedBinaryLogicalPredicateNode
  | ResolvedAndPredicateNode
  | ResolvedOrPredicateNode
  | ResolvedXorPredicateNode
  | ResolvedNotPredicateNode;

export type PredicateNode =
  | ComparisonPredicateNode
  | BinaryLogicalPredicateNode
  | AndPredicateNode
  | OrPredicateNode
  | XorPredicateNode
  | NotPredicateNode;