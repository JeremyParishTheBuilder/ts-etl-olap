import { Action } from "./Action.js";
import type { EngineContext } from "../engine/EngineContext.js";

export class DropColumnAction implements Action {
  constructor(
    private table: string,
    private columnName: string
  ) {}

  apply(ctx: EngineContext) {
    //ctx.validate.dropColumn(this.column);
    ctx.resolver
      .requireTable(true, this.table)
      .dropColumn(this.columnName);
  }
}