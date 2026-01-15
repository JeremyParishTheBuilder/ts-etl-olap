import { Action } from "./Action.js";
import type { EngineContext } from "../engine/EngineContext.js";
import { Database } from "../types/Database.js"; 

export class CreateDatabaseAction implements Action {
  constructor(
    private name: string
  ) {}

  apply(ctx: EngineContext) {
    ctx.validate.createDatabase(this.name);
    ctx.resolver
      .resolveTx()
      .setDatabase(new Database(this.name));
  }
}