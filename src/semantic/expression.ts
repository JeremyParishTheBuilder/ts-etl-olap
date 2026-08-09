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
import type { ColumnValue } from "../types/ColumnValue.js";

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

export function assertInsertExpression(expr: ExpressionNode): void {
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

    case "case":
      for (const branch of expr.branches) {
        assertInsertPredicate(branch.when);
        assertInsertExpression(branch.then);
      }

      if (expr.elseExpr) {
        assertInsertExpression(expr.elseExpr);
      }

      return;
  }
}

export function bindInsertExpression(
  expr: ExpressionNode,
  table: Table,
): Expression<undefined, ColumnValue> {
  switch (expr.kind) {
    case "literal":
      return new LiteralExpression(expr.value);

    case "temporal":
      return new TemporalExpression(expr.expression);

    case "sql_function":
      return new SqlFunctionExpression(expr.function_);

    case "binary":
      return new BinaryExpression(
        bindInsertExpression(expr.left, table),
        expr.operator,
        bindInsertExpression(expr.right, table),
      );

    case "concat":
      return new ConcatExpression(
        expr.expressions.map((e) => bindInsertExpression(e, table)),
      );

    case "case":
      return new CaseExpression(
        expr.branches.map((branch) => ({
          when: bindInsertPredicate(branch.when, table),
          then: bindInsertExpression(branch.then, table),
        })),
        expr.elseExpr ? bindInsertExpression(expr.elseExpr, table) : undefined,
      );

    case "column":
      throw new Error("INSERT VALUES expressions cannot reference columns.");
  }
}
