import { Action } from "../actions/Action.js";
import type { EngineContext } from "../engine/EngineContext.js";

export class UseDatabaseAction implements Action {
  constructor(
    public dbName: string
  ) {}

  apply(ctx: EngineContext) {
    ctx.resolver.requireDatabase(false, this.dbName);
    ctx.resolver.resolveTx().currentDatabase = this.dbName;
  }
}