import { ComparisonPredicate } from "../evaluation/predicate/ComparisonPredicate.js";
import { NotPredicate } from "../evaluation/predicate/NotPredicate.js";
import {
  type PredicateNode,
  type ResolvedPredicateNode,
} from "../ast/predicate/PredicateNode.js";
import { type Predicate } from "../evaluation/predicate/Predicate.js";
import { type Table } from "../relational/Table.js";
import { ResolvedNotPredicateNode } from "../ast/predicate/NotPredicateNode.js";
import {
  assertInsertExpression,
  bindExpression,
  bindInsertExpression,
  resolveExpression,
} from "./expression.js";
import { ResolvedComparisonPredicateNode } from "../ast/predicate/ComparisonPredicateNode.js";
import { AndPredicate } from "../evaluation/predicate/AndPredicate.js";
import { OrPredicate } from "../evaluation/predicate/OrPredicate.js";
import { XorPredicate } from "../evaluation/predicate/XorPredicate.js";
import { ResolvedAndPredicateNode } from "../ast/predicate/AndPredicateNode.js";
import { ResolvedOrPredicateNode } from "../ast/predicate/OrPredicateNode.js";
import { ResolvedXorPredicateNode } from "../ast/predicate/XorPredicateNode.js";
import { ResolvedIsNullPredicateNode } from "../ast/predicate/IsNullPredicateNode.js";
import { ResolvedIsNotNullPredicateNode } from "../ast/predicate/IsNotNullPredicateNode.js";
import { IsNullPredicate } from "../evaluation/predicate/IsNull.js";
import { IsNotNullPredicate } from "../evaluation/predicate/IsNotNull.js";
import type { RowView } from "../relational/RowView.js";

export function bindPredicate(
  pred: ResolvedPredicateNode,
  table: Table,
): Predicate<RowView> {
  switch (pred.kind) {
    case "comparison": {
      return new ComparisonPredicate(
        bindExpression(pred.left, table),
        pred.operator,
        bindExpression(pred.right, table),
      );
    }

    case "and": {
      return new AndPredicate(
        pred.predicates.map((p) => bindPredicate(p, table)),
      );
    }

    case "or": {
      return new OrPredicate(
        pred.predicates.map((p) => bindPredicate(p, table)),
      );
    }

    case "xor": {
      return new XorPredicate(
        bindPredicate(pred.left, table),
        bindPredicate(pred.right, table),
      );
    }

    case "not": {
      return new NotPredicate(bindPredicate(pred.inner, table));
    }

    case "is_null": {
      return new IsNullPredicate(bindExpression(pred.inner, table));
    }

    case "is_not_null": {
      return new IsNotNullPredicate(bindExpression(pred.inner, table));
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
        predicate.predicates.map((p) => resolvePredicate(p, table)),
      );

    case "or":
      return new ResolvedOrPredicateNode(
        predicate.predicates.map((p) => resolvePredicate(p, table)),
      );

    case "xor":
      return new ResolvedXorPredicateNode(
        resolvePredicate(predicate.left, table),
        resolvePredicate(predicate.right, table),
      );

    case "not":
      return new ResolvedNotPredicateNode(
        resolvePredicate(predicate.inner, table),
      );

    case "is_null":
      return new ResolvedIsNullPredicateNode(
        resolveExpression(predicate.inner, table),
      );

    case "is_not_null":
      return new ResolvedIsNotNullPredicateNode(
        resolveExpression(predicate.inner, table),
      );

    default:
      throw new Error(
        `Unknown predicate kind: ${(predicate as { kind?: string }).kind}`,
      );
  }
}

export function assertInsertPredicate(predicate: PredicateNode): void {
  switch (predicate.kind) {
    case "comparison":
      assertInsertExpression(predicate.left);
      assertInsertExpression(predicate.right);
      return;

    case "and":
    case "or":
      predicate.predicates.map((p) => assertInsertPredicate(p));
      return;

    case "xor":
      assertInsertPredicate(predicate.left);
      assertInsertPredicate(predicate.right);
      return;

    case "not":
      assertInsertPredicate(predicate.inner);
      return;

    case "is_null":
    case "is_not_null":
      assertInsertExpression(predicate.inner);
      return;
  }
}

export function bindInsertPredicate(pred: PredicateNode): Predicate<undefined> {
  switch (pred.kind) {
    case "comparison": {
      return new ComparisonPredicate(
        bindInsertExpression(pred.left),
        pred.operator,
        bindInsertExpression(pred.right),
      );
    }

    case "and": {
      return new AndPredicate(
        pred.predicates.map((p) => bindInsertPredicate(p)),
      );
    }

    case "or": {
      return new OrPredicate(
        pred.predicates.map((p) => bindInsertPredicate(p)),
      );
    }

    case "xor": {
      return new XorPredicate(
        bindInsertPredicate(pred.left),
        bindInsertPredicate(pred.right),
      );
    }

    case "not": {
      return new NotPredicate(bindInsertPredicate(pred.inner));
    }

    case "is_null": {
      return new IsNullPredicate(bindInsertExpression(pred.inner));
    }

    case "is_not_null": {
      return new IsNotNullPredicate(bindInsertExpression(pred.inner));
    }

    //TODO: BETWEEN, LIKE, IN
    //thought.... change syntax to only take column name in where clause, then expand....

    default:
      throw new Error(`Unknown predicate type`);
  }
}
