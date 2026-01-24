import { type BaseStatement, type StatementBuilder } from "../Statement.js";
import {type ColumnValue } from "../../types/Column.js"

export interface InsertIntoStatement extends BaseStatement {
  kind: "insert_into",
  table: string,
  columns: string[],
  values: ColumnValue[][],
  returning?: string[],
}

export class InsertIntoBuilder implements StatementBuilder {
  private valuesData?: ColumnValue[][];
  private returningCols?: string[];

  constructor(
    private table: string,
    private columns: string[] = [],
  ) {}

  values(data: ColumnValue[][]) {
    this.valuesData = data;
  }

  returning(cols: string[]) {
    if (!this.valuesData) {
      throw new Error(`Cannot call returning() before values()`);
    }
    this.returningCols = cols;
  }

  getNextCalls() {
    if (!this.valuesData) return {
      required: ["values"],
      optional: []
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
      returning: this.returningCols
    };
  }

}
