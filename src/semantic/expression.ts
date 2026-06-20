import { BinaryExpression } from "../evaluation/expression/BinaryExpressionNode.js";
import { CaseExpression } from "../evaluation/expression/CaseExpression.js";
import { ColumnExpression } from "../evaluation/expression/ColumnExpression.js";
import {
  type ExpressionNode,
  type Expression
} from "../evaluation/expression/Expression.js";
import { LiteralExpression } from "../evaluation/expression/LiteralExpression.js";
import { type Table } from "../schema/Table.js";
import { bindPredicate } from "./predicate.js";

export function bindExpression(
  expr: ExpressionNode,
  table: Table
): Expression {
  switch (expr.kind) {
    case "literal":
      return new LiteralExpression(expr.value);

    case "column":
      const columnIndex = table.columns.requireByName(expr.columnName).position;

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

    case "binaryExpression": {
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