import { ComparisonPredicate } from "../evaluation/predicate/ComparisonPredicate.js";
import { BinaryLogicalPredicate, NotPredicate } from "../evaluation/predicate/LogicalPredicate.js";
import { type PredicateNode, type Predicate } from "../evaluation/predicate/Predicate.js";
import { type Table } from "../schema/Table.js";
import { bindExpression } from "./expression.js";

export function bindPredicate(
  pred: PredicateNode,
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
      throw new Error(`Unknown WhereClause type`);
  }
}