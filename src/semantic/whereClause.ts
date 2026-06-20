import { ComparisonPredicate } from "../evaluation/predicate/ComparisonPredicate.js";
import { BinaryLogicalPredicate, NotPredicate } from "../evaluation/predicate/LogicalPredicate.js";
import { type Predicate } from "../evaluation/predicate/Predicate.js";
import { type WhereClause } from "../statements/WhereClause.js";
import { type Table } from "../schema/Table.js";
import { ColumnExpression } from "../evaluation/expression/ColumnExpression.js";
import { LiteralExpression } from "../evaluation/expression/LiteralExpression.js";

export function bindWhereClause(
  clause: WhereClause,
  //pred: Predicate,
  table: Table,
): Predicate {
  switch (clause.type) {
    case "comparison": {
      const column = table.columns.requireByName(clause.column);

      return new ComparisonPredicate(
        new ColumnExpression(column.position),
        clause.operator,
        new LiteralExpression(clause.value)
      );
    }

    case "logical": {
      const left = bindWhereClause(clause.left, table);
      const right = bindWhereClause(clause.right, table);

      return new BinaryLogicalPredicate(
        left,
        right,
        clause.operator
      );
    }

    case "not": {
      const inner = bindWhereClause(/*semantic, */clause.inner, table);

      return new NotPredicate(
        inner
      );
    }

    case "between": {
      const inner = bindWhereClause(/*semantic, */clause, table);

      return new NotPredicate(
        inner
      );
    }

    case "in": {
      const inner = bindWhereClause(/*semantic, */clause, table);

      return new NotPredicate(
        inner
      );
    }

    case "null_check": {
      const inner = bindWhereClause(/*semantic, */clause, table);

      return new NotPredicate(
        inner
      );
    }

    //TODO: BETWEEN, LIKE, IN
    //thought.... change syntax to only take column name in where clause, then expand....

    default:
      throw new Error(`Unknown WhereClause type`);
  }
}