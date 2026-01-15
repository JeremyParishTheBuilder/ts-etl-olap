import type { Engine } from "./Engine.js";
import type { EngineContext } from "./EngineContext.js";
import { DatabaseContainer } from "../types/DatabaseContainer.js";
import type { Statement } from "../statements/Statement.js";
import type { Action } from "../actions/Action.js";
import type { Database } from "../types/Database.js";

export class TransactionContext extends DatabaseContainer {
  private actions: Action[] = [];
  public stmts: Statement<any>[] = [];

  constructor(
    private trackStmts?: boolean
  ) {
    super()
  }

  addActionsFromStatement(stmt: Statement<any>) {
    if (this.trackStmts) {
      this.stmts.push(stmt);
    }
    this.actions.push(...stmt.getActions());
  }

  commit(engine: Engine, ctx: EngineContext) {
    for (const action of this.actions) {
      action.apply(ctx);
    }

    if (this.currentDatabase) {
      engine.currentDatabase = this.currentDatabase;
    }

    for (const [name, db] of this.databases.entries()) {
      engine.setDatabase(db);
    }
  }

  rollback() {
    this.stmts = [];
    this.actions = [];
    this.databases.clear();
    this.currentDatabase = undefined;
  }
}
