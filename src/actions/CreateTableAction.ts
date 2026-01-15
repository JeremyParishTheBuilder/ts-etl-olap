import { Action } from "./Action.js";
import type { EngineContext } from "../engine/EngineContext.js";
import { Table } from "../types/Table.js"; 

export class CreateTableAction implements Action {
  constructor(
    private name: string
  ) {}

  apply(ctx: EngineContext) {
    //ctx.validate.createTable(this.name);
    ctx.resolver
      .resolveDatabase(true)!
      .tables.set(this.name, new Table(this.name));
  }
}