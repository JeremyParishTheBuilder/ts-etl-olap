import { type ResolvedExpressionNode } from "../evaluation/expression/Expression.js";
import { type ResolvedPredicateNode } from "../evaluation/predicate/Predicate.js";
import { type ColumnId } from "../schema/Column.js";

export class ResolvedPredicateColumnCollector {

  public static collect(
    predicate: ResolvedPredicateNode
  ): ColumnId[] {

    const columns = new Set<ColumnId>();

    this.collectPredicate(predicate, columns);

    return [...columns];
  }

  private static collectPredicate(
    predicate: ResolvedPredicateNode,
    columns: Set<ColumnId>
  ): void {

    switch (predicate.kind) {

      case "comparison":
        this.collectExpression(predicate.left, columns);
        this.collectExpression(predicate.right, columns);
        return;

      case "binaryLogical":
        this.collectPredicate(predicate.left, columns);
        this.collectPredicate(predicate.right, columns);
        return;

      case "not":
        this.collectPredicate(predicate.inner, columns);
        return;

      default:
        throw new Error(`Predicate Kind not recognized`);
    }
  }

  private static collectExpression(
    expr: ResolvedExpressionNode,
    columns: Set<ColumnId>
  ): void {

    switch (expr.kind) {

      case "column":
        columns.add(expr.columnId);
        return;

      case "literal":
        return;

      case "binary":
        this.collectExpression(expr.left, columns);
        this.collectExpression(expr.right, columns);
        return;

      case "case":

        for (const branch of expr.branches) {
          this.collectPredicate(
            branch.when,
            columns
          );

          this.collectExpression(
            branch.then,
            columns
          );
        }

        if (expr.elseExpr) {
          this.collectExpression(
            expr.elseExpr,
            columns
          );
        }

        return;

      default:
        throw new Error(`Expression Kind not recognized`);
    }
  }
}