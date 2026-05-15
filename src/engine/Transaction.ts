import { type ExecutionContext } from "./ExecutionContext.js";
import { type Statement } from "../statements/Statement.js";

import { SemanticAnalyzer } from "../semantic/SemanticAnalyzer.js";
import { Databases } from "../schema/Databases.js";
import { type Action } from "../actions/Action.js";

export class Transaction {
  public readonly id: number;
  public databases: Databases;
  public stmts: Statement[] = [];
  public actions: Action[] = [];

  constructor(
    id: number,
    databases: Databases,
  ) {
    this.id = id;
    this.databases = databases;
  }

  public addStatement(stmt: Statement) {
    this.stmts.push(stmt);
  }

  public addActions(actions: Action[]): void {
    for (const action of actions) {
      this.databases = action.apply(this.databases);
    }
    
    this.actions.push(...actions);
  }
}