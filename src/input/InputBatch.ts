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
  type ConstraintStatement,
  type StatementBuilder,
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
import type { InsertValuesInput } from "../types/InsertSource.js";
import type { SelectInput } from "../types/SelectInput.js";
import { QueryStatementBuilder } from "../statements/dql/QueryStatementBuilder.js";
import type { QueryStatement } from "../statements/dql/QueryStatement.js";

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
    "deleteFrom",
    "values",
  ];

  constructor(
    protected readonly executeStatement: (stmt: Statement) => RowView[] | void,
  ) {}

  protected abstract createInputBatch(): this;

  private addStatement(stmt: Statement) {
    this.statements.push(stmt);
  }

  private finalizeStatement() {
    if (!this.currentBuilder) {
      return;
    }

    this.addStatement(this.currentBuilder.createStatement());
    this.currentBuilder = null;
    return;
  }

  private getAllowedCalls(): {
    allowed: string[];
    required: string[];
  } {
    const allowed: string[] = [];
    const required: string[] = [];

    if (this.currentBuilder) {
      const next = this.currentBuilder.getNextCalls();

      allowed.push(...next.required, ...next.optional);
      required.push(...next.required);

      if (next.required.length > 0) {
        return { allowed, required };
      }
    }

    return {
      allowed,
      required,
    };
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

    const { allowed } = this.getAllowedCalls();

    if (!allowed.includes(canonical)) {
      console.log("allowed");
      console.log(allowed);
      throw new Error(`'${fragment}' is not valid here`);
    }
  }

  // ---- Statements ----

  protected begin(fragment: string = "BEGIN") {
    this.assertAllowed("begin", fragment);
    this.finalizeStatement();
    this.currentBuilder = new BeginBuilder();
    this.finalizeStatement();
    return this;
  }

  protected commit(fragment: string = "COMMIT") {
    this.assertAllowed("commit", fragment);
    this.finalizeStatement();
    this.currentBuilder = new CommitBuilder();
    this.finalizeStatement();
    return this;
  }

  protected useDatabase(dbName: string, fragment: string = "USE DATABASE") {
    this.assertAllowed("useDatabase", fragment);
    this.finalizeStatement();
    this.currentBuilder = new UseDatabaseBuilder(dbName);
    this.finalizeStatement();
    return this;
  }

  protected createDatabase(
    dbName: string,
    fragment: string = "CREATE DATABASE",
  ) {
    this.assertAllowed("createDatabase", fragment);
    this.finalizeStatement();
    this.currentBuilder = new CreateDatabaseBuilder(dbName);
    this.finalizeStatement();
    return this;
  }

  protected createTable(
    name: string,
    columnList?: InlineColumnSpec[],
    constraintList?: ConstraintSpec[],
    fragment: string = "CREATE TABLE",
  ) {
    this.assertAllowed("createTable", fragment);
    this.finalizeStatement();

    this.currentBuilder = new CreateTableBuilder(
      name,
      columnList,
      constraintList,
    );

    return this;
  }

  protected as(query: InputBatch, fragment: string = "AS") {
    this.assertAllowed("as", fragment);

    if (!(this.currentBuilder instanceof CreateTableBuilder)) {
      throw new Error(
        `Cannot use '${fragment}' with a constructed query outside CREATE TABLE`,
      );
    }

    this.currentBuilder.as(query.asQueryStatement());
    return this;
  }

  protected insertInto(
    table: string /* | NameWithAlias*/,
    columns: string[],
    fragment: string = "INSERT INTO",
  ) {
    this.finalizeStatement();
    this.assertAllowed("insertInto", fragment);

    this.currentBuilder = new InsertIntoBuilder(table, columns);

    return this;
  }

  protected values(data: InsertValuesInput[][], fragment: string = "VALUES") {
    this.assertAllowed("values", fragment);

    if (
      !(this.currentBuilder instanceof InsertIntoBuilder) // &&
      //!(this.currentBuilder instanceof CreateTableBuilder)
      // TODO - add to create table
    ) {
      throw new Error(`Cannot call '${fragment}' outside of InsertInto`);
    }

    this.currentBuilder.values(data);
    return this;
  }

  protected returning(cols: string[], fragment: string = "RETURNING") {
    this.assertAllowed("returning", fragment);
    if (
      !(this.currentBuilder instanceof InsertIntoBuilder) &&
      !(this.currentBuilder instanceof UpdateSetBuilder)
    ) {
      throw new Error(`Cannot call '${fragment}' outside of InsertInto`);
    }
    this.currentBuilder.returning(cols);
    return this;
  }

  protected update(table: string, fragment: string = "UPDATE") {
    this.assertAllowed("update", fragment);
    this.finalizeStatement();
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
    this.finalizeStatement();
    this.currentBuilder = new DeleteFromBuilder(table);
    return this;
  }

  protected alterTable(name: string, fragment: string = "ALTER TABLE") {
    this.assertAllowed("alterTable", fragment);
    this.finalizeStatement();
    this.currentBuilder = new AlterTableBuilder(name);
    return this;
  }

  protected addColumn(
    columnList: InlineColumnSpec[],
    fragment: string = "ADD COLUMN",
  ) {
    this.assertAllowed("addColumn", fragment);
    if (!(this.currentBuilder instanceof AlterTableBuilder)) {
      throw new Error(`Cannot call '${fragment}' outside of AlterTable`);
    }
    this.currentBuilder.addColumn(columnList);
    return this;
  }

  protected dropColumn(
    columnNames: string[],
    fragment: string = "DROP COLUMN",
  ) {
    this.assertAllowed("dropColumn", fragment);
    if (!(this.currentBuilder instanceof AlterTableBuilder)) {
      throw new Error(`Cannot call '${fragment}' outside of AlterTable`);
    }
    this.currentBuilder.dropColumn(columnNames);
    return this;
  }

  protected renameColumn(
    from: string,
    to: string,
    fragment: string = "RENAME COLUMN",
  ) {
    this.assertAllowed("renameColumn", fragment);
    if (!(this.currentBuilder instanceof AlterTableBuilder)) {
      throw new Error(`Cannot call '${fragment}' outside of AlterTable`);
    }
    this.currentBuilder.renameColumn(from, to);
    return this;
  }

  protected alterColumn(
    columnList: InlineColumnSpec[],
    fragment: string = "ALTER COLUMN",
  ) {
    this.assertAllowed("alterColumn", fragment);
    if (!(this.currentBuilder instanceof AlterTableBuilder)) {
      throw new Error(`Cannot call '${fragment}' outside of AlterTable`);
    }
    this.currentBuilder.modifyColumn(columnList);
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

  protected select(
    expressionsOrQuery: SelectInput[] | "*" | InputBatch,
    fragment: string = "SELECT",
  ) {
    if (!isInputBatch(expressionsOrQuery) && this.currentBuilder !== null) {
      const newQueryInputCursor = this.createInputBatch();
      newQueryInputCursor.select(expressionsOrQuery);
      return newQueryInputCursor;
    }

    this.assertAllowed("select", fragment);

    if (isInputBatch(expressionsOrQuery)) {
      if (this.currentBuilder instanceof InsertIntoBuilder) {
        this.currentBuilder.select(expressionsOrQuery.asQueryStatement());
        return this;
      }

      throw new Error(`Statement does not accept a query here.`);
    }

    this.currentBuilder = new SelectBuilder(expressionsOrQuery);
    return this;
  }

  protected unionAll(query: InputBatch, fragment: string = "UNION ALL") {
    this.assertAllowed("unionAll", fragment);

    if (!(this.currentBuilder instanceof QueryStatementBuilder)) {
      throw new Error(`Cannot call '${fragment}' without a preceding Query`);
    }

    this.currentBuilder = this.currentBuilder.unionAll(
      query.asQueryStatement(),
    );
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
    this.finalizeStatement();

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

  asQueryStatement(): QueryStatement {
    const statement = this.asStatement();

    if (!isQueryStatement(statement)) {
      throw new Error("Statement is not a query statement.");
    }

    return statement;
  }

  execute(): RowView[][] {
    this.finalizeStatement();

    const resultIterators: RowView[][] = [];

    const statementsToExecute = [...this.statements];
    this.statements = [];

    for (const stmt of statementsToExecute) {
      const result = this.executeStatement(stmt);

      if (isQueryStatement(stmt) && result !== undefined) {
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

function isQueryStatement(value: unknown): value is QueryStatement {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    (value.kind === "select" || value.kind === "unionAll")
  );
}

export function isInputBatch(value: unknown): value is InputBatch {
  return value instanceof InputBatch;
}
