import { Action } from "./Action.js";
import type { EngineContext } from "../engine/EngineContext.js";
import type { ColumnValue } from "../types/Column.js";
import { type InsertRow, type InsertValue, bindInsertRows } from "../engine/InsertModel.js";

export class InsertIntoAction implements Action {
  constructor(
    private table: string,
    private columns: string[],
    private values: ColumnValue[][],
  ) {}

  apply(ctx: EngineContext) {
    //convert ColumnValues into InputValues first??
    const semanticValues: InsertValue[][] = this.values.map(row =>
      row.map(val => syntaxToSemanticInsertValue(val, ctx.rules.values.keywords))
    );

    const table = ctx.resolver
      .requireTable(true, this.table);

    const insertRows: InsertRow[] = bindInsertRows(table, this.columns, semanticValues);

    //ctx.validate.insertInto(this.table, insertRows); //e.g., to validate FK

    ctx.resolver
      .requireTable(true, this.table)
      .insertInto(insertRows, ctx.txId); //validate other constraints, get default values, actually add to table
  }
}

function syntaxToSemanticInsertValue(
  val: ColumnValue,
  rules: string[]
): InsertValue {
  if (typeof val === "string" && rules.includes(val.toUpperCase())) {
    switch (val.toUpperCase()) {
      case "DEFAULT": return { kind: "default" };
      case "NULL": return { kind: "null" };
      default: return { kind: "value", value: val };
    }
  } else {
    return { kind: "value", value: val };
  }
}