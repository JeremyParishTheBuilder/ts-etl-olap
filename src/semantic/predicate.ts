import { ComparisonPredicate } from "../evaluation/predicate/ComparisonPredicate.js";
import { NotPredicate } from "../evaluation/predicate/NotPredicate.js";
import { 
  type PredicateNode,
  type ResolvedPredicateNode
} from "./ast/predicate/PredicateNode.js";
import { type Predicate } from "../evaluation/predicate/Predicate.js";
import { type Table } from "../relational/Table.js";
import { ResolvedNotPredicateNode } from "./ast/predicate/NotPredicateNode.js";
import { bindExpression, resolveExpression } from "./expression.js";
import { ResolvedComparisonPredicateNode } from "./ast/predicate/ComparisonPredicateNode.js";
import { AndPredicate } from "../evaluation/predicate/AndPredicate.js";
import { OrPredicate } from "../evaluation/predicate/OrPredicate.js";
import { XorPredicate } from "../evaluation/predicate/XorPredicate.js";
import { ResolvedAndPredicateNode } from "./ast/predicate/AndPredicateNode.js";
import { ResolvedOrPredicateNode } from "./ast/predicate/OrPredicateNode.js";
import { ResolvedXorPredicateNode } from "./ast/predicate/XorPredicateNode.js";

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

    case "and": {
      return new AndPredicate(
        pred.predicates.map(p => bindPredicate(p, table))
      );
    }

    case "or": {
      return new OrPredicate(
        pred.predicates.map(p => bindPredicate(p, table))
      );
    }

    case "xor": {
      return new XorPredicate(
        bindPredicate(pred.left, table),
        bindPredicate(pred.right, table)
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
  predicate: PredicateNode, // <- union type
  table: Table,
): ResolvedPredicateNode {
  switch (predicate.kind) {
    case "comparison":
      return new ResolvedComparisonPredicateNode(
        resolveExpression(predicate.left, table),
        predicate.operator,
        resolveExpression(predicate.right, table),
      );

    case "and":
      return new ResolvedAndPredicateNode(
        predicate.predicates.map(p => resolvePredicate(p, table))
      );

    case "or":
      return new ResolvedOrPredicateNode(
        predicate.predicates.map(p => resolvePredicate(p, table))
      );

    case "xor":
      return new ResolvedXorPredicateNode(
        resolvePredicate(predicate.left, table),
        resolvePredicate(predicate.right, table)
      );

    case "not":
      return new ResolvedNotPredicateNode(
        resolvePredicate(predicate.inner, table),
      );

    default:
      throw new Error(
        `Unknown predicate kind: ${(predicate as { kind?: string }).kind}`
      );
  }
}