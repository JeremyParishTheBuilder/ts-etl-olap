import {
  type ResolvedAndPredicateNode,
  type AndPredicateNode,
} from "./AndPredicateNode.js";
import {
  type ResolvedOrPredicateNode,
  type OrPredicateNode,
} from "./OrPredicateNode.js";
import {
  type ResolvedXorPredicateNode,
  type XorPredicateNode,
} from "./XorPredicateNode.js";
import {
  type NotPredicateNode,
  type ResolvedNotPredicateNode,
} from "./NotPredicateNode.js";
import {
  type ComparisonPredicateNode,
  type ResolvedComparisonPredicateNode,
} from "./ComparisonPredicateNode.js";
import type { IsNullPredicateNode, ResolvedIsNullPredicateNode } from "./IsNullPredicateNode.js";
import type { IsNotNullPredicateNode, ResolvedIsNotNullPredicateNode } from "./IsNotNullPredicateNode.js";

export type ResolvedPredicateNode =
  | ResolvedComparisonPredicateNode
  | ResolvedAndPredicateNode
  | ResolvedOrPredicateNode
  | ResolvedXorPredicateNode
  | ResolvedNotPredicateNode
  | ResolvedIsNullPredicateNode
  | ResolvedIsNotNullPredicateNode;

export type PredicateNode =
  | ComparisonPredicateNode
  | AndPredicateNode
  | OrPredicateNode
  | XorPredicateNode
  | NotPredicateNode
  | IsNullPredicateNode
  | IsNotNullPredicateNode;
