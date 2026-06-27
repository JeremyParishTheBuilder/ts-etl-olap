import {
  ComparisonPredicate,
  ResolvedComparisonPredicateNode
} from "../evaluation/predicate/ComparisonPredicate.js";
import {
  BinaryLogicalPredicate,
  NotPredicate,
  ResolvedBinaryLogicalPredicateNode,
  ResolvedNotPredicateNode
} from "../evaluation/predicate/LogicalPredicate.js";
import {
  type PredicateNode,
  type Predicate,
  type ResolvedPredicateNode
} from "../evaluation/predicate/Predicate.js";
import { type Table } from "../schema/Table.js";
import { bindExpression, resolveExpression } from "./expression.js";

export function bindPredicate(
  pred: ResolvedPredicateNode,
  table: Table,
): Predicate {
  switch (pred.kind) {
    case "comparison": {
      return new ComparisonPredicate(
        bindExpression(pred.left, table),
        pred.operator,
        bindExpression(pred.right, table)
      );
    }

    case "binaryLogical": {
      return new BinaryLogicalPredicate(
        bindPredicate(pred.left, table),
        bindPredicate(pred.right, table),
        pred.operator
      );
    }

    case "not": {
      return new NotPredicate(
        bindPredicate(pred.inner, table)
      );
    }

    //TODO: BETWEEN, LIKE, IN
    //thought.... change syntax to only take column name in where clause, then expand....

    default:
      throw new Error(`Unknown predicate type`);
  }
}

export function resolvePredicate(
  predicate: PredicateNode,
  table: Table,
): ResolvedPredicateNode {
  switch (predicate.kind) {
    case "comparison":
      return new ResolvedComparisonPredicateNode(
        resolveExpression(predicate.left, table),
        predicate.operator,
        resolveExpression(predicate.right, table),
      );

    case "binaryLogical":
      return new ResolvedBinaryLogicalPredicateNode(
        resolvePredicate(predicate.left, table),
        resolvePredicate(predicate.right, table),
        predicate.operator,
      );

    case "not":
      return new ResolvedNotPredicateNode(
        resolvePredicate(predicate.inner, table),
      );

    default:
      throw new Error(
        `Unknown predicate kind: ${(predicate as any).kind}`
      );
  }
}