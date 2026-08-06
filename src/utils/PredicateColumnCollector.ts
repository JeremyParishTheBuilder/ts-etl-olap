import { type ResolvedPredicateNode } from "../semantic/ast/predicate/PredicateNode.js";
import { type ColumnId } from "../relational/Column.js";
import type { ResolvedExpressionNode } from "../semantic/ast/expression/ExpressionNode.js";

export class ResolvedPredicateColumnCollector {
  public static collect(predicate: ResolvedPredicateNode): ColumnId[] {
    const columns = new Set<ColumnId>();

    this.collectPredicate(predicate, columns);

    return [...columns];
  }

  private static collectPredicate(
    predicate: ResolvedPredicateNode,
    columns: Set<ColumnId>,
  ): void {
    switch (predicate.kind) {
      case "comparison":
        this.collectExpression(predicate.left, columns);
        this.collectExpression(predicate.right, columns);
        return;

      case "and":
        predicate.predicates.map((p) => this.collectPredicate(p, columns));
        return;

      case "or":
        predicate.predicates.map((p) => this.collectPredicate(p, columns));
        return;

      case "xor":
        this.collectPredicate(predicate.left, columns);
        this.collectPredicate(predicate.right, columns);
        return;

      case "not":
        this.collectPredicate(predicate.inner, columns);
        return;

      case "is_null":
        this.collectExpression(predicate.inner, columns);
        return;

      case "is_not_null":
        this.collectExpression(predicate.inner, columns);
        return;

      default:
        throw new Error(`Predicate Kind not recognized`);
    }
  }

  private static collectExpression(
    expr: ResolvedExpressionNode,
    columns: Set<ColumnId>,
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
          this.collectPredicate(branch.when, columns);

          this.collectExpression(branch.then, columns);
        }

        if (expr.elseExpr) {
          this.collectExpression(expr.elseExpr, columns);
        }

        return;

      default:
        throw new Error(`Expression Kind not recognized`);
    }
  }
}
