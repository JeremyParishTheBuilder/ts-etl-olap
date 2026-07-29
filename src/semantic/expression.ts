import { BinaryExpression } from "../evaluation/expression/BinaryExpression.js";
import { ResolvedCaseExpressionNode } from "./ast/expression/CaseExpressionNode.js";
import { ColumnExpression } from "../evaluation/expression/ColumnExpression.js";
import {
  type ExpressionNode,
  type Expression,
  type ResolvedExpressionNode,
} from "../evaluation/expression/Expression.js";
import { LiteralExpression } from "../evaluation/expression/LiteralExpression.js";
import { type RowView } from "../relational/RowView.js";
import { type Table } from "../relational/Table.js";
import { bindPredicate, resolvePredicate } from "./predicate.js";
import { CaseExpression } from "../evaluation/expression/CaseExpression.js";
import { ResolvedColumnExpressionNode } from "./ast/expression/ColumnExpressionNode.js";
import { ResolvedBinaryExpressionNode } from "./ast/expression/BinaryExpressionNode.js";

export function bindExpression(
  expr: ResolvedExpressionNode,
  table: Table,
): Expression<RowView> {
  switch (expr.kind) {
    case "literal":
      return new LiteralExpression(expr.value);

    case "column":
      return new ColumnExpression(
        table.columns.require(expr.columnId).position,
      );

    case "case":
      return new CaseExpression(
        expr.branches.map((branch) => ({
          when: bindPredicate(branch.when, table),
          then: bindExpression(branch.then, table),
        })),
        expr.elseExpr ? bindExpression(expr.elseExpr, table) : undefined,
      );

    case "binary": {
      return new BinaryExpression(
        bindExpression(expr.left, table),
        expr.operator,
        bindExpression(expr.right, table),
      );
    }

    default: {
      throw new Error(`Unsupported expression kind: ${expr}`);
    }
  }
}

export function resolveExpression(
  expr: ExpressionNode,
  table: Table,
): ResolvedExpressionNode {
  switch (expr.kind) {
    case "literal":
      return expr;

    case "column":
      return new ResolvedColumnExpressionNode(
        table.columns.requireIdByName(expr.columnName),
      );

    case "case":
      return new ResolvedCaseExpressionNode(
        expr.branches.map((branch) => ({
          when: resolvePredicate(branch.when, table),
          then: resolveExpression(branch.then, table),
        })),
        expr.elseExpr ? resolveExpression(expr.elseExpr, table) : undefined,
      );

    case "binary": {
      return new ResolvedBinaryExpressionNode(
        resolveExpression(expr.left, table),
        expr.operator,
        resolveExpression(expr.right, table),
      );
    }

    default: {
      throw new Error(`Unsupported expression kind: ${expr}`);
    }
  }
}
