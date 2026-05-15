import { WhereColumnBuilder } from "../statements/dql/WhereColumnBuilder.js";
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
  type Builder,
  isStatementBuilder,
} from "../statements/index.js";
import { type ColumnValue, type InlineColumnSpec } from "../schema/Column.js";
import { type ConstraintSpec } from "../schema/Constraint.js";

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
    "delete",
  ];

  constructor(
    protected readonly executeStatement: (stmt: Statement) => void,
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

  protected addColumn(
    columnName: string,
    inlineColumnSpec: InlineColumnSpec,
    fragment: string = "ADD COLUMN"
  ) {
    this.assertAllowed("addColumn", fragment);
    if (!(this.currentBuilder instanceof AlterTableBuilder)) {
      throw new Error(`Cannot call '${fragment}' outside of AlterTable`);
    }
    this.currentBuilder.addColumn(columnName, inlineColumnSpec);
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

  protected select(
    columns: string[] | "*",
    fragment: string = "SELECT"
  ) {
    this.assertAllowed("select", fragment);
    this.finalizePreviousStatement();
    this.currentBuilder = new SelectBuilder(columns);
    return this;
  }

  protected from(
    name: string,
    fragment: string = "FROM"
  ) {
    this.assertAllowed("from", fragment);
    if (!(this.currentBuilder instanceof SelectBuilder)) {
      throw new Error(`Cannot call '${fragment}' outside of Select`);
    }
    this.currentBuilder.from(name);
    return this;
  }

  protected where(
    column: string,
    fragment: string = "WHERE",
  ) {
    this.assertAllowed("where", fragment);
    if (
      !(this.currentBuilder instanceof SelectBuilder) &&
      !(this.currentBuilder instanceof UpdateSetBuilder)// &&
      //!(this.currentBuilder instanceof DeleteBuilder) // not implemented yet, TODO
    ) {
      throw new Error(`Cannot call '${fragment}' outside of SELECT/UPDATE/DELETE`);
    }
    this.currentBuilder = this.currentBuilder.where(column); // temporarily sets the currentBuilder to whereColumnBuilder
    return this;
  }

  protected eq(
    value: ColumnValue,
    fragment: string = "eq",
  ) {
    this.assertAllowed("eq", fragment);

    if (!(this.currentBuilder instanceof WhereColumnBuilder)) {
      throw new Error(`Cannot call '${fragment}' outside of WHERE clause`);
    }

    this.currentBuilder = this.currentBuilder.eq(value);

    return this;
  }

  protected and(
    column: string,
    fragment: string = "AND",
  ) {
    this.assertAllowed("and", fragment);

    if (
      !(this.currentBuilder instanceof SelectBuilder) // TODO add updatesetbuilder and delete
    ) {
      throw new Error(`Cannot call '${fragment}' outside of SELECT/UPDATE/DELETE`);
    }

    this.currentBuilder = this.currentBuilder.and(column);
    
    return this;
  }

  execute() {
    this.finalizePreviousStatement();

    let resultIterators = [];

    for (const stmt of this.statements) {
      const result = this.executeStatement(stmt);
      if (stmt.kind === "select") resultIterators.push(result);
    }

    this.statements = [];

    return resultIterators;
  }
}