import { Action } from "./Action.js";
import type { EngineContext } from "../engine/EngineContext.js";
import type { Column } from "../types/Column.js";

export class AlterColumnAction implements Action {
  constructor(
    private table: string,
    private columnName: string,
    private column: Column
  ) {}

  apply(ctx: EngineContext) {
    //ctx.validate.dropColumn(this.column);
    ctx.resolver
      .requireTable(true, this.table)
      .alterColumn(this.columnName, this.column);
  }
}