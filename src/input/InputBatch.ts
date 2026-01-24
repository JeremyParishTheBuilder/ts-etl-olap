import {
  type Statement,
  type StatementBuilder,
  BeginBuilder,
  CommitBuilder,
  UseDatabaseBuilder,
  CreateDatabaseBuilder,
  CreateTableBuilder,
  AlterTableBuilder,
  InsertIntoBuilder,
} from "../statements/index.js";
import { type RulesFacadeShape } from "../engine/RulesFacade.js";
import { type TransactionContext } from "../engine/TransactionContext.js";
import { InlineColumnSpec } from "../types/Column.js";
import { ConstraintSpec } from "../types/Constraint.js";

export abstract class InputBatch {
  private statements: Statement[] = [];
  private currentBuilder: StatementBuilder | null = null;

  static statementStarters = [
    "begin",
    "commit",
    "createDatabase",
    "createTable",
    "alterTable",
    "useDatabase",
    "insertInto",
    "select",
    "update",
    "delete",
  ];

  constructor(
    protected readonly rules: RulesFacadeShape,
    protected readonly beginTx: () => void,
    protected readonly commitTx: () => void,
    protected readonly getTx: () => TransactionContext | undefined
  ) {}

  private addStatement(stmt: Statement) {
    this.statements.push(stmt);
  }

  private finalizePreviousStatement() {
    if (this.currentBuilder) {
      this.addStatement(this.currentBuilder.createStatement());
      this.currentBuilder = null;
    }
  }

  private assertAllowed(canonical: string, fragment: string) {
    if (!this.currentBuilder) {
      if (!InputBatch.statementStarters.includes(canonical)) {
        throw new Error(
          `'${fragment}' cannot be used outside of a statement (or must start a statement)`
        );
      }
      return;
    }

    const { required, optional } = this.currentBuilder.getNextCalls();

    if (required.length > 0 && !required.includes(canonical)) {
      throw new Error(`Expected ${required.join(" or ")}, but got '${fragment}'`);
    }

    if (
      !required.length &&
      !optional.includes(canonical) &&
      !InputBatch.statementStarters.includes(canonical)
    ) {
      throw new Error(`'${fragment}' is not valid here`);
    }
  }

  // ---- Statements ----

  protected begin(fragment: string = "BEGIN") {
    this.assertAllowed("begin", fragment);
    this.finalizePreviousStatement();
    this.currentBuilder = new BeginBuilder();
    this.finalizePreviousStatement();
    return this;
  }

  protected commit(fragment: string = "COMMIT") {
    this.assertAllowed("commit", fragment);
    this.finalizePreviousStatement();
    this.currentBuilder = new CommitBuilder();
    this.finalizePreviousStatement();
    return this;
  }

  protected useDatabase(dbName: string, fragment: string = "USE DATABASE") {
    this.assertAllowed("useDatabase", fragment);
    this.finalizePreviousStatement();
    this.currentBuilder = new UseDatabaseBuilder(dbName);
    this.finalizePreviousStatement();
    return this;
  }

  protected createDatabase(dbName: string, fragment: string = "CREATE DATABASE") {
    this.assertAllowed("createDatabase", fragment);
    this.finalizePreviousStatement();
    this.currentBuilder = new CreateDatabaseBuilder(dbName);
    this.finalizePreviousStatement();
    return this;
  }

  protected createTable(
    name: string,
    columnSchema: Record<string, InlineColumnSpec>,
    constraintSchema: Record<string, ConstraintSpec>,
    fragment: string = "CREATE TABLE"
  ) {
    this.assertAllowed("createTable", fragment);
    this.finalizePreviousStatement();
    this.currentBuilder = new CreateTableBuilder(name, columnSchema, constraintSchema);
    this.finalizePreviousStatement();
    return this;
  }

  protected insertInto(table: string, columns: string[], fragment: string = "INSERT INTO") {
    this.assertAllowed("insertInto", fragment); 
    this.finalizePreviousStatement();
    this.currentBuilder = new InsertIntoBuilder(table, columns);
    return this;
  }

  protected values(data: any[][], fragment: string = "VALUES") {
    this.assertAllowed("values", fragment);
    if (!(this.currentBuilder instanceof InsertIntoBuilder)) {
      throw new Error(`Cannot call '${fragment}' outside of InsertInto`);
    }
    this.currentBuilder.values(data);
    return this;
  }

  protected returning(cols: string[], fragment: string = "RETURNING") {
    this.assertAllowed("returning", fragment);
    if (!(this.currentBuilder instanceof InsertIntoBuilder)) {
      throw new Error(`Cannot call '${fragment}' outside of InsertInto`);
    }
    this.currentBuilder.returning(cols);
    return this;
  }

  protected alterTable(
    name: string,
    fragment: string = "ALTER TABLE"
  ) {
    this.assertAllowed("alterTable", fragment);
    this.finalizePreviousStatement();
    this.currentBuilder = new AlterTableBuilder(name);
    return this;
  }

  protected addConstraint(
    name: string,
    fragment: string = "ADD CONSTRAINT"
  ) {
    this.assertAllowed("addConstraint", fragment);
    if (!(this.currentBuilder instanceof AlterTableBuilder)) {
      throw new Error(`Cannot call '${fragment}' outside of AlterTable`);
    }
    this.currentBuilder.addConstraint(name);
    return this;
  }

  protected foreignKey(
    columns: string[],
    fragment: string = "FOREIGN KEY"
  ) {
    this.assertAllowed("foreignKey", fragment);
    if (!(this.currentBuilder instanceof AlterTableBuilder)) {
      throw new Error(`Cannot call '${fragment}' outside of AlterTable`);
    }
    this.currentBuilder.foreignKey(columns);
    return this;
  }

  protected references(
    parentTable: string,
    parentColumns: string[],
    fragment: string = "REFERENCES"
  ) {
    this.assertAllowed("references", fragment);
    if (!(this.currentBuilder instanceof AlterTableBuilder)) {
      throw new Error(`Cannot call '${fragment}' outside of AlterTable`);
    }
    this.currentBuilder.references(parentTable, parentColumns);
    return this;
  }

  execute() {
    if (this.currentBuilder) {
      this.addStatement(this.currentBuilder.createStatement());
      this.currentBuilder = null;
    }

    for (const stmt of this.statements) {
      if (stmt.kind === "begin") { 
        // Explicit BEGIN
        this.beginTx();
        continue;
      } else if (stmt.kind === "commit") { 
        // Explicit COMMIT
        this.commitTx();
        continue;
      }

      const tx = this.getTx();

      if (tx) {
        // Statement inside an existing transaction
        tx.addStatement(stmt);
      } else if (!this.rules.transaction.autoCommit) {
        // No transaction and auto-commit is OFF → error
        throw new Error("Auto-commit is disabled: statements must be inside a BEGIN ... COMMIT block");
      } else {
        // Auto-commit is ON → run statement in temporary transaction
        this.executeAutoCommit(stmt);
      }
    }
  }

  private executeAutoCommit(stmt: Statement) {
    // Start a temporary transaction
    this.beginTx();
    
    const actx = this.getTx();
    if (!actx) {
      throw new Error("Failed to start auto-commit transaction");
    }
    // Add the statement to the transaction context
    actx.addStatement(stmt);
    
    // Commit immediately
    this.commitTx();
  }
}