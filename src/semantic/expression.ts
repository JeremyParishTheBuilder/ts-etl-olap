import {
  BinaryExpression,
  ResolvedBinaryExpressionNode
} from "../evaluation/expression/BinaryExpressionNode.js";
import {
  CaseExpression,
  ResolvedCaseExpressionNode
} from "../evaluation/expression/CaseExpression.js";
import {
  ColumnExpression,
  ResolvedColumnExpressionNode
} from "../evaluation/expression/ColumnExpression.js";
import {
  type ExpressionNode,
  type Expression,
  type ResolvedExpressionNode
} from "../evaluation/expression/Expression.js";
import { LiteralExpression } from "../evaluation/expression/LiteralExpression.js";
import { type Table } from "../schema/Table.js";
import { bindPredicate, resolvePredicate } from "./predicate.js";

export function bindExpression(
  expr: ResolvedExpressionNode,
  table: Table
): Expression {
  switch (expr.kind) {
    case "literal":
      return new LiteralExpression(expr.value);

    case "column":
      const columnIndex = table.columns.require(expr.columnId).position;

      return new ColumnExpression(columnIndex);

    case "case":
      return new CaseExpression(
        expr.branches.map(branch => ({
          when: bindPredicate(
            branch.when,
            table,
          ),
          then: bindExpression(
            branch.then,
            table,
          ),
        })),
        expr.elseExpr
          ? bindExpression(expr.elseExpr, table)
          : undefined,
      );

    case "binary": {
      return new BinaryExpression(
        bindExpression(expr.left, table),
        expr.operator,
        bindExpression(expr.right, table),
      );
    }

    default: {
      throw new Error(
        `Unsupported expression kind: ${expr}`
      );
    }
  }
}

export function resolveExpression(
  expr: ExpressionNode,
  table: Table
): ResolvedExpressionNode {
  switch (expr.kind) {
    case "literal":
      return expr;

    case "column":
      const columnId = table.columns.requireIdByName(expr.columnName);

      return new ResolvedColumnExpressionNode(columnId);

    case "case":
      return new ResolvedCaseExpressionNode(
        expr.branches.map(branch => ({
          when: resolvePredicate(
            branch.when,
            table,
          ),
          then: resolveExpression(
            branch.then,
            table,
          ),
        })),
        expr.elseExpr
          ? resolveExpression(expr.elseExpr, table)
          : undefined,
      );

    case "binary": {
      return new ResolvedBinaryExpressionNode(
        resolveExpression(expr.left, table),
        expr.operator,
        resolveExpression(expr.right, table),
      );
    }

    default: {
      throw new Error(
        `Unsupported expression kind: ${expr}`
      );
    }
  }
}