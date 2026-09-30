import { ComparisonPredicate } from "../evaluation/predicate/ComparisonPredicate.js";
import { NotPredicate } from "../evaluation/predicate/NotPredicate.js";
import {
  type PredicateNode,
  type ResolvedPredicateNode,
} from "../ast/predicate/PredicateNode.js";
import { type Predicate } from "../evaluation/predicate/Predicate.js";
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
import type { ColumnResolver } from "./relation/ColumnResolver.js";
import type { ColumnBinder } from "./relation/ColumnBinder.js";

export function bindPredicate(
  pred: ResolvedPredicateNode,
  binder: ColumnBinder,
): Predicate<RowView> {
  switch (pred.kind) {
    case "comparison": {
      return new ComparisonPredicate(
        bindExpression(pred.left, binder),
        pred.operator,
        bindExpression(pred.right, binder),
      );
    }

    case "and": {
      return new AndPredicate(
        pred.predicates.map((p) => bindPredicate(p, binder)),
      );
    }

    case "or": {
      return new OrPredicate(
        pred.predicates.map((p) => bindPredicate(p, binder)),
      );
    }

    case "xor": {
      return new XorPredicate(
        bindPredicate(pred.left, binder),
        bindPredicate(pred.right, binder),
      );
    }

    case "not": {
      return new NotPredicate(bindPredicate(pred.inner, binder));
    }

    case "is_null": {
      return new IsNullPredicate(bindExpression(pred.inner, binder));
    }

    case "is_not_null": {
      return new IsNotNullPredicate(bindExpression(pred.inner, binder));
    }

    //TODO: BETWEEN, LIKE, IN
    //thought.... change syntax to only take column name in where clause, then expand....

    default:
      throw new Error(`Unknown predicate type`);
  }
}

export function resolvePredicate(
  predicate: PredicateNode,
  scope: ColumnResolver,
): ResolvedPredicateNode {
  switch (predicate.kind) {
    case "comparison":
      return new ResolvedComparisonPredicateNode(
        resolveExpression(predicate.left, scope),
        predicate.operator,
        resolveExpression(predicate.right, scope),
      );

    case "and":
      return new ResolvedAndPredicateNode(
        predicate.predicates.map((p) => resolvePredicate(p, scope)),
      );

    case "or":
      return new ResolvedOrPredicateNode(
        predicate.predicates.map((p) => resolvePredicate(p, scope)),
      );

    case "xor":
      return new ResolvedXorPredicateNode(
        resolvePredicate(predicate.left, scope),
        resolvePredicate(predicate.right, scope),
      );

    case "not":
      return new ResolvedNotPredicateNode(
        resolvePredicate(predicate.inner, scope),
      );

    case "is_null":
      return new ResolvedIsNullPredicateNode(
        resolveExpression(predicate.inner, scope),
      );

    case "is_not_null":
      return new ResolvedIsNotNullPredicateNode(
        resolveExpression(predicate.inner, scope),
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
