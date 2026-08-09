import { type BaseStatement, type StatementBuilder } from "../Statement.js";
import type { InsertInput } from "../../types/InsertInput.js";
import type { ExpressionNode } from "../../ast/expression/ExpressionNode.js";
import type { DefaultValueNode } from "../../ast/DefaultValueNode.js";
import { toExpressionNode } from "../../semantic/toExpressionNode.js";

export interface InsertIntoStatement extends BaseStatement {
  kind: "insert_into";
  table: string;
  columns: string[];
  values: (ExpressionNode | DefaultValueNode)[][];
  returning?: string[];
}

export class InsertIntoBuilder implements StatementBuilder {
  private valuesData?: (ExpressionNode | DefaultValueNode)[][];
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

  returning(cols: string[]) {
    if (!this.valuesData) {
      throw new Error(`Cannot call returning() before values()`);
    }
    this.returningCols = cols;
  }

  getNextCalls() {
    if (!this.valuesData)
      return {
        required: ["values"],
        optional: [],
      };
    return {
      required: [],
      optional: ["returning"],
    };
  }

  createStatement(): InsertIntoStatement {
    if (!this.valuesData) {
      throw new Error("Missing required call: values()");
    }

    return {
      kind: "insert_into",
      table: this.table,
      columns: this.columns,
      values: this.valuesData,
      returning: this.returningCols,
    };
  }
}
