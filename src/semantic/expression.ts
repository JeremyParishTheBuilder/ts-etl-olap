import { BinaryExpression } from "../evaluation/expression/BinaryExpression.js";
import { ResolvedCaseExpressionNode } from "../ast/expression/CaseExpressionNode.js";
import { ColumnExpression } from "../evaluation/expression/ColumnExpression.js";
import { LiteralExpression } from "../evaluation/expression/LiteralExpression.js";
import { type RowView } from "../relational/RowView.js";
import { type Table } from "../relational/Table.js";
import {
  assertInsertPredicate,
  bindInsertPredicate,
  bindPredicate,
  resolvePredicate,
} from "./predicate.js";
import { CaseExpression } from "../evaluation/expression/CaseExpression.js";
import { ResolvedColumnExpressionNode } from "../ast/expression/ColumnExpressionNode.js";
import { ResolvedBinaryExpressionNode } from "../ast/expression/BinaryExpressionNode.js";
import type {
  ExpressionNode,
  ResolvedExpressionNode,
} from "../ast/expression/ExpressionNode.js";
import type { Expression } from "../evaluation/expression/Expression.js";
import { TemporalExpression } from "../evaluation/expression/TemporalExpression.js";
import { ResolvedConcatExpressionNode } from "../ast/expression/ConcatExpressionNode.js";
import { ConcatExpression } from "../evaluation/expression/ConcatExpression.js";
import { SqlFunctionExpression } from "../evaluation/expression/SqlFunctionExpression.js";
import { isColumnValue, type ColumnValue } from "../types/ColumnValue.js";
import { isCastable, type SqlType } from "../types/SqlType.js";
import { ResolvedCastExpressionNode } from "../ast/expression/CastExpressionNode.js";
import { CastExpression } from "../evaluation/expression/CastExpression.js";
import { LiteralExpressionNode } from "../ast/expression/LiteralExpressionNode.js";
import { isExpressionNodeUnion } from "../ast/expression/isExpressionNodeUnion.js";

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

    case "temporal":
      return new TemporalExpression(expr.expression);

    case "sql_function":
      return new SqlFunctionExpression(expr.function_);

    case "case":
      return new CaseExpression(
        expr.branches.map((branch) => ({
          when: bindPredicate(branch.when, table),
          then: bindExpression(branch.then, table),
        })),
        expr.elseExpr ? bindExpression(expr.elseExpr, table) : undefined,
      );

    case "cast": {
      const sourceType = getKnownSqlType(expr, table);

      if (sourceType !== undefined && !isCastable(sourceType, expr.type)) {
        throw new Error(`Cannot CAST from ${sourceType} to ${expr.type}`);
      }

      return new CastExpression(bindExpression(expr.expr, table), expr.type);
    }

    case "binary": {
      return new BinaryExpression(
        bindExpression(expr.left, table),
        expr.operator,
        bindExpression(expr.right, table),
      );
    }

    case "concat": {
      return new ConcatExpression(
        expr.expressions.map((expression) => bindExpression(expression, table)),
      );
    }

    default: {
      throw new Error(`Unsupported expression kind: ${expr}`);
    }
  }
}

export function resolveExpression(
  expr: ExpressionNode | ColumnValue,
  table: Table,
): ResolvedExpressionNode {
  if (isColumnValue(expr)) {
    return new LiteralExpressionNode(expr);
  }

  if (!isExpressionNodeUnion(expr)) {
    throw new Error(`Unsupported expression node: ${expr.kind}`);
  }

  switch (expr.kind) {
    case "literal":
      return expr;

    case "column":
      return new ResolvedColumnExpressionNode(
        table.columns.requireIdByName(expr.columnName),
      );

    case "temporal":
      return expr;

    case "sql_function":
      return expr;

    case "case":
      return new ResolvedCaseExpressionNode(
        expr.branches.map((branch) => ({
          when: resolvePredicate(branch.when, table),
          then: resolveExpression(branch.then, table),
        })),
        expr.elseExpr ? resolveExpression(expr.elseExpr, table) : undefined,
      );

    case "cast": {
      return new ResolvedCastExpressionNode(
        resolveExpression(expr.expr, table),
        expr.type,
      );
    }

    case "binary": {
      return new ResolvedBinaryExpressionNode(
        resolveExpression(expr.left, table),
        expr.operator,
        resolveExpression(expr.right, table),
      );
    }

    case "concat":
      return new ResolvedConcatExpressionNode(
        expr.expressions.map((expression) =>
          resolveExpression(expression, table),
        ),
      );

    default: {
      throw new Error(`Unsupported expression kind: ${expr}`);
    }
  }
}

export function assertInsertExpression(
  expr: ExpressionNode | ColumnValue,
): void {
  if (isColumnValue(expr)) {
    return;
  }

  if (!isExpressionNodeUnion(expr)) {
    throw new Error(`Unsupported expression node: ${expr.kind}`);
  }

  switch (expr.kind) {
    case "literal":
    case "temporal":
    case "sql_function":
      return;

    case "column":
      throw new Error(`INSERT VALUES expressions cannot reference columns.`);

    case "binary":
      assertInsertExpression(expr.left);
      assertInsertExpression(expr.right);
      return;

    case "concat":
      for (const expression of expr.expressions) {
        assertInsertExpression(expression);
      }
      return;

    case "cast":
      assertInsertExpression(expr.expr);
      return;

    case "case":
      for (const branch of expr.branches) {
        assertInsertPredicate(branch.when);
        assertInsertExpression(branch.then);
      }

      if (expr.elseExpr) {
        assertInsertExpression(expr.elseExpr);
      }

      return;

    default:
      throw new Error();
  }
}

//TODO, why does this need table?
export function bindInsertExpression(
  expr: ExpressionNode | ColumnValue,
): Expression<undefined, ColumnValue> {
  if (isColumnValue(expr)) {
    return new LiteralExpression(expr);
  }

  if (!isExpressionNodeUnion(expr)) {
    throw new Error(`Unsupported expression node: ${expr.kind}`);
  }

  switch (expr.kind) {
    case "literal":
      return new LiteralExpression(expr.value);

    case "temporal":
      return new TemporalExpression(expr.expression);

    case "sql_function":
      return new SqlFunctionExpression(expr.function_);

    case "binary":
      return new BinaryExpression(
        bindInsertExpression(expr.left),
        expr.operator,
        bindInsertExpression(expr.right),
      );

    case "concat":
      return new ConcatExpression(
        expr.expressions.map((e) => bindInsertExpression(e)),
      );

    case "cast":
      return new CastExpression(
        bindInsertExpression(expr.expr),
        expr.type,
      );

    case "case":
      return new CaseExpression(
        expr.branches.map((branch) => ({
          when: bindInsertPredicate(branch.when),
          then: bindInsertExpression(branch.then),
        })),
        expr.elseExpr ? bindInsertExpression(expr.elseExpr) : undefined,
      );

    case "column":
      throw new Error("INSERT VALUES expressions cannot reference columns.");

    default:
      throw new Error(`Invalid Expression Node`);
  }
}

function getKnownSqlType(
  expr: ResolvedExpressionNode,
  table: Table,
): SqlType | undefined {
  if (expr.kind !== "column") {
    return undefined;
  }

  return table.columns.require(expr.columnId).type;
}
