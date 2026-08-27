import { type BaseStatement, type StatementBuilder } from "../Statement.js";
import type { InsertInput } from "../../types/InsertInput.js";
import type { DefaultValueNode } from "../../ast/DefaultValueNode.js";
import { toExpressionNode } from "../../semantic/toExpressionNode.js";
import type { ExpressionNode } from "../../ast/expression/ExpressionNode.js";
import type { SelectStatement } from "../dql/SelectStatement.js";

export interface InsertIntoStatement extends BaseStatement {
  kind: "insert_into";
  table: string;
  columns: string[];
  values?: (ExpressionNode | DefaultValueNode)[][];
  select?: SelectStatement;
  returning?: string[];
}

export class InsertIntoBuilder implements StatementBuilder {
  private valuesData?: (ExpressionNode | DefaultValueNode)[][];
  private selectStatement?: SelectStatement;
  private returningCols?: string[];

  constructor(
    private table: string,
    private columns: string[] = [],
  ) {}

  values(data: InsertInput[][]) {
    const normalized: (ExpressionNode | DefaultValueNode)[][] = [];

    for (const row of data) {
      const normalizedRow: (ExpressionNode | DefaultValueNode)[] = [];

      for (const value of row) {
        normalizedRow.push(toExpressionNode(value));
      }

      normalized.push(normalizedRow);
    }

    this.valuesData = normalized;
  }

  select(query: SelectStatement) {
    this.selectStatement = query;
  }

  returning(cols: string[]) {
    if (!this.valuesData && !this.selectStatement) {
      throw new Error(`Cannot call returning() before values() or select()`);
    }
    this.returningCols = cols;
  }

  getNextCalls() {
    if (!this.valuesData && !this.selectStatement)
      return {
        required: ["values", "select"],
        optional: [],
      };
    return {
      required: [],
      optional: ["returning"],
    };
  }

  createStatement(): InsertIntoStatement {
    const hasValues = this.valuesData !== undefined;
    const hasSelect = this.selectStatement !== undefined;

    if (hasValues === hasSelect) {
      throw new Error("INSERT requires exactly one of values() or select()");
    }

    return {
      kind: "insert_into",
      table: this.table,
      columns: this.columns,
      values: this.valuesData,
      select: this.selectStatement,
      returning: this.returningCols,
    };
  }
}
