import { Action } from "./Action.js";
import type { EngineContext } from "../engine/EngineContext.js";

export class RenameColumnAction implements Action {
  constructor(
    private table: string,
    private oldColumnName: string,
    private newColumnName: string
  ) {}

  apply(ctx: EngineContext) {
    //ctx.validate.dropColumn(this.column);
    ctx.resolver
      .requireTable(true, this.table)
      .renameColumn(this.oldColumnName, this.newColumnName);
  }
}