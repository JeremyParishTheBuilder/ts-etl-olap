import type { Engine } from "./Engine.js";
import { type EngineContext } from "./EngineContext.js";
import { DatabaseContainer } from "../types/DatabaseContainer.js";
import { type Statement } from "../statements/Statement.js";
import {
  CreateTableStatement,
  AlterTableStatement,
  InsertIntoStatement,
} from "../statements/index.js";
import type { Action } from "../actions/Action.js";
import { SemanticAnalyzer } from "../semantic/SemanticAnalyzer.js";

export class TransactionContext extends DatabaseContainer {
  private actions: Action[] = [];
  public stmts: Statement[] = [];

  constructor(
    private trackStmts?: boolean
  ) {
    super()
  }

  addStatement(stmt: Statement) {
    this.stmts.push(stmt);
  }

  commit(engine: Engine, ctx: EngineContext) {
    const analyzer = new SemanticAnalyzer(ctx);
    for (const stmt of this.stmts) {
    const actions = analyzer.bindStatement(stmt);

    for (const action of actions) {
        action.apply(ctx);
      }
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
