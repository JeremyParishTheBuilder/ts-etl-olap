import { ComparisonPredicate } from "../query/predicate/ComparisonPredicate.js";
import { BinaryLogicalPredicate, NotPredicate } from "../query/predicate/LogicalPredicate.js";
import { type Predicate } from "../query/predicate/Predicate.js";
import { type WhereClause } from "../statements/WhereClause.js";
import { type Table } from "../schema/Table.js";
import { type SemanticAnalyzer } from "./SemanticAnalyzer.js";

export function bindPredicate(
  semantic: SemanticAnalyzer,
  clause: WhereClause,
  table: Table,
): Predicate {
  switch (clause.type) {
    case "comparison": {
      const column = table.requireColumn(clause.column);

      return new ComparisonPredicate(
        column.position,
        clause.operator,
        clause.value
      );
    }

    case "logical": {
      const left = bindPredicate(semantic, clause.left, table);
      const right = bindPredicate(semantic, clause.right, table);

      return new BinaryLogicalPredicate(
        left,
        right,
        clause.operator
      );
    }

    case "not": {
      const inner = bindPredicate(semantic, clause, table);

      return new NotPredicate(
        inner
      );
    }

    case "between": {
      const inner = bindPredicate(semantic, clause, table);

      return new NotPredicate(
        inner
      );
    }

    case "in": {
      const inner = bindPredicate(semantic, clause, table);

      return new NotPredicate(
        inner
      );
    }

    case "null_check": {
      const inner = bindPredicate(semantic, clause, table);

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