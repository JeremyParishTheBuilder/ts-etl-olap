import { Action } from "./Action.js";
import type { EngineContext } from "../engine/EngineContext.js";
import type { Column } from "../types/Column.js";

export class AddColumnAction implements Action {
  constructor(
    private table: string,
    private column: Column
  ) {}

  apply(ctx: EngineContext) {
    //ctx.validate.addColumn(this.column);
    ctx.resolver
      .requireTable(true, this.table)
      .addColumn(this.column);
  }
}