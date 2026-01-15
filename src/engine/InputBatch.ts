import { Engine } from "./Engine.js";
import { Statement } from "../statements/Statement.js";

export class InputBatch {
  private stmts: Statement<any>[] = [];

  constructor(private engine: Engine) {}

  addStatement(stmt: Statement<any>) {
    this.stmts.push(stmt);
  }

  execute() {
    for (const stmt of this.stmts) {
      if (stmt.isBegin()) { 
        // Explicit BEGIN
        this.engine.beginTx();
        continue;
      } else if (stmt.isCommit()) { 
        // Explicit COMMIT
        this.engine.commitTx();
        continue;
      }

      const tx = this.engine.getTx();

      if (tx) {
        // Statement inside an existing transaction
        tx.addActionsFromStatement(stmt);
      } else if (!this.engine.rules.transaction.autoCommit) {
        // No transaction and auto-commit is OFF → error
        throw new Error("Auto-commit is disabled: statements must be inside a BEGIN ... COMMIT block");
      } else {
        // Auto-commit is ON → run statement in temporary transaction
        this.executeAutoCommit(stmt);
      }
    }
  }

  private executeAutoCommit(stmt: Statement<any>) {
    // Start a temporary transaction
    this.engine.beginTx();
    
    const actx = this.engine.getTx();
    if (!actx) {
      throw new Error("Failed to start auto-commit transaction");
    }
    // Add the statement's actions to the transaction
    actx.addActionsFromStatement(stmt);
    
    // Commit immediately
    this.engine.commitTx();
  }
}