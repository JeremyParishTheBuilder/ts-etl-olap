import {
  type Statement,
  BeginBuilder,
  CommitBuilder,
  UseDatabaseBuilder,
  CreateDatabaseBuilder,
  CreateTableBuilder,
  AlterTableBuilder,
  InsertIntoBuilder,
  SelectBuilder,
  UpdateSetBuilder,
  DeleteFromBuilder,
  type Builder,
  isStatementBuilder,
  type ConstraintStatement,
} from "../statements/index.js";
import { type InlineColumnSpec } from "../relational/Column.js";
import { type ConstraintSpec } from "../relational/Constraint.js";
import { type ReferentialAction } from "../relational/ReferentialAction.js";
import { type PredicateNode } from "../ast/predicate/PredicateNode.js";
import { CONSTRAINT_KIND } from "../relational/ConstraintKind.js";
import {
  CURRENT_DATE,
  CURRENT_TIME,
  CURRENT_TIMESTAMP,
  DEFAULT,
  GETDATE,
  NOW,
} from "../dialect/keywords.js";
import type { UpdateInput } from "../types/UpdateInput.js";
import type { RowView } from "../relational/RowView.js";
import type { InsertInput } from "../types/InsertInput.js";

export abstract class InputBatch {
  private statements: Statement[] = [];
  private currentBuilder: Builder | null = null;

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
    "deleteFrom",
  ];

  constructor(
    protected readonly executeStatement: (stmt: Statement) => RowView[] | void,
  ) {}

  private addStatement(stmt: Statement) {
    this.statements.push(stmt);
  }

  private finalizePreviousStatement() {
    if (this.currentBuilder && isStatementBuilder(this.currentBuilder)) {
      this.addStatement(this.currentBuilder.createStatement());
      this.currentBuilder = null;
    }
  }

  private assertAllowed(canonical: string, fragment: string) {
    if (!this.currentBuilder) {
      if (!InputBatch.statementStarters.includes(canonical)) {
        throw new Error(
          `'${fragment}' cannot be used outside of a statement (or must start a statement)`,
        );
      }
      return;
    }

    const { required, optional } = this.currentBuilder.getNextCalls();

    if (required.length > 0 && !required.includes(canonical)) {
      throw new Error(
        `Expected ${required.join(" or ")}, but got '${fragment}'`,
      );
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

  protected createDatabase(
    dbName: string,
    fragment: string = "CREATE DATABASE",
  ) {
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
    fragment: string = "CREATE TABLE",
  ) {
    this.assertAllowed("createTable", fragment);
    this.finalizePreviousStatement();
    this.currentBuilder = new CreateTableBuilder(
      name,
      columnSchema,
      constraintSchema,
    );
    this.finalizePreviousStatement();
    return this;
  }

  protected insertInto(
    table: string,
    columns: string[],
    fragment: string = "INSERT INTO",
  ) {
    this.assertAllowed("insertInto", fragment);
    this.finalizePreviousStatement();
    this.currentBuilder = new InsertIntoBuilder(table, columns);
    return this;
  }

  protected values(data: InsertInput[][], fragment: string = "VALUES") {
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
      throw new Error(`Cannot call '${fragment}' outside of InsertInto`); // TODO, also on update?
    }
    this.currentBuilder.returning(cols);
    return this;
  }

  protected update(table: string, fragment: string = "UPDATE") {
    this.assertAllowed("update", fragment);
    this.finalizePreviousStatement();
    this.currentBuilder = new UpdateSetBuilder(table);
    return this;
  }

  protected set(data: Record<string, UpdateInput>, fragment: string = "SET") {
    this.assertAllowed("set", fragment);
    if (!(this.currentBuilder instanceof UpdateSetBuilder)) {
      throw new Error(`Cannot call '${fragment}' outside of Update`);
    }
    this.currentBuilder.set(data);
    return this;
  }

  protected deleteFrom(table: string, fragment: string = "DELETE FROM") {
    this.assertAllowed("deleteFrom", fragment);
    this.finalizePreviousStatement();
    this.currentBuilder = new DeleteFromBuilder(table);
    return this;
  }

  protected alterTable(name: string, fragment: string = "ALTER TABLE") {
    this.assertAllowed("alterTable", fragment);
    this.finalizePreviousStatement();
    this.currentBuilder = new AlterTableBuilder(name);
    return this;
  }

  protected addColumn(
    columnName: string,
    inlineColumnSpec: InlineColumnSpec,
    fragment: string = "ADD COLUMN",
  ) {
    this.assertAllowed("addColumn", fragment);
    if (!(this.currentBuilder instanceof AlterTableBuilder)) {
      throw new Error(`Cannot call '${fragment}' outside of AlterTable`);
    }
    this.currentBuilder.addColumn(columnName, inlineColumnSpec);
    return this;
  }

  protected addConstraint(name: string, fragment: string = "ADD CONSTRAINT") {
    this.assertAllowed("addConstraint", fragment);
    if (!(this.currentBuilder instanceof AlterTableBuilder)) {
      throw new Error(`Cannot call '${fragment}' outside of AlterTable`);
    }
    this.currentBuilder.addConstraint(name);
    return this;
  }

  protected unique(columns: string[], fragment: string = "UNIQUE") {
    this.assertAllowed("unique", fragment);
    if (!(this.currentBuilder instanceof AlterTableBuilder)) {
      throw new Error(`Cannot call '${fragment}' outside of AlterTable`);
    }
    this.currentBuilder.unique(columns);
    return this;
  }

  protected check(predicate: PredicateNode, fragment: string = "CHECK") {
    this.assertAllowed("check", fragment);
    if (!(this.currentBuilder instanceof AlterTableBuilder)) {
      throw new Error(`Cannot call '${fragment}' outside of AlterTable`);
    }
    this.currentBuilder.check(predicate);
    return this;
  }

  protected foreignKey(columns: string[], fragment: string = "FOREIGN KEY") {
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
    fragment: string = "REFERENCES",
  ) {
    this.assertAllowed("references", fragment);
    if (!(this.currentBuilder instanceof AlterTableBuilder)) {
      throw new Error(`Cannot call '${fragment}' outside of AlterTable`);
    }
    this.currentBuilder.references(parentTable, parentColumns);
    return this;
  }

  protected onDelete(
    action: ReferentialAction,
    fragment: string = "ON DELETE",
  ) {
    this.assertAllowed("onDelete", fragment);
    if (!(this.currentBuilder instanceof AlterTableBuilder)) {
      throw new Error(`Cannot call '${fragment}' outside of AlterTable`);
    }
    this.currentBuilder.onDelete(action);
    return this;
  }

  protected onUpdate(
    action: ReferentialAction,
    fragment: string = "ON UPDATE",
  ) {
    this.assertAllowed("onUpdate", fragment);
    if (!(this.currentBuilder instanceof AlterTableBuilder)) {
      throw new Error(`Cannot call '${fragment}' outside of AlterTable`);
    }
    this.currentBuilder.onUpdate(action);
    return this;
  }

  protected select(columns: string[] | "*", fragment: string = "SELECT") {
    this.assertAllowed("select", fragment);
    this.finalizePreviousStatement();
    this.currentBuilder = new SelectBuilder(columns);
    return this;
  }

  protected from(name: string, fragment: string = "FROM") {
    this.assertAllowed("from", fragment);
    if (!(this.currentBuilder instanceof SelectBuilder)) {
      throw new Error(`Cannot call '${fragment}' outside of Select`);
    }
    this.currentBuilder.from(name);
    return this;
  }

  protected where(predicate: PredicateNode, fragment: string = "WHERE") {
    this.assertAllowed("where", fragment);
    if (
      !(this.currentBuilder instanceof SelectBuilder) &&
      !(this.currentBuilder instanceof UpdateSetBuilder) &&
      !(this.currentBuilder instanceof DeleteFromBuilder)
    ) {
      throw new Error(
        `Cannot call '${fragment}' outside of SELECT/UPDATE/DELETE`,
      );
    }
    this.currentBuilder.where(predicate);
    return this;
  }

  readonly DEFAULT: typeof DEFAULT = DEFAULT;

  readonly CURRENT_TIMESTAMP: typeof CURRENT_TIMESTAMP = CURRENT_TIMESTAMP;
  readonly CURRENT_DATE: typeof CURRENT_DATE = CURRENT_DATE;
  readonly CURRENT_TIME: typeof CURRENT_TIME = CURRENT_TIME;

  NOW(): typeof NOW {
    return NOW;
  }

  GETDATE(): typeof GETDATE {
    return GETDATE;
  }

  asStatement(): Statement | undefined {
    this.finalizePreviousStatement();

    return this.statements.pop();
  }

  asConstraintStatement(): ConstraintStatement {
    const statement = this.asStatement();

    if (!isConstraintStatement(statement)) {
      throw new Error(
        "Statement is not a Unique, Check, or ForeignKey addition statement.",
      );
    }

    return statement;
  }

  execute(): RowView[][] {
    this.finalizePreviousStatement();

    const resultIterators: RowView[][] = [];

    const statementsToExecute = [...this.statements];
    this.statements = [];

    for (const stmt of statementsToExecute) {
      const result = this.executeStatement(stmt);

      if (stmt.kind === "select" && result !== undefined) {
        resultIterators.push(result);
      }
    }

    return resultIterators;
  }
}

function isConstraintStatement(
  statement: Statement | undefined,
): statement is ConstraintStatement {
  return (
    statement?.kind === "alter_table" &&
    statement.op === "add_constraint" &&
    statement.constraint.kind !== CONSTRAINT_KIND.primaryKey
  );
}
