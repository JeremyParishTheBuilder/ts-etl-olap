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
} from "../statements/index.js";
import { type InlineColumnSpec } from "../schema/Column.js";
import { type ConstraintSpec } from "../schema/Constraint.js";
import { type ReferentialAction } from "../schema/ReferentialAction.js";
import { CaseBuilder } from "../dsl/case/CaseBuilder.js";
import { type ExpressionNode } from "../evaluation/expression/Expression.js";
import { type ExplicitInput } from "../types/ExplicitInput.js";
import { type PredicateNode } from "../evaluation/predicate/Predicate.js";
import { BinaryLogicalPredicateNode, NotPredicateNode } from "../evaluation/predicate/LogicalPredicate.js";
import { ColumnExpressionNode } from "../evaluation/expression/ColumnExpression.js";

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

  protected set(data: Record<string, ExpressionNode | ExplicitInput>, fragment: string = "SET") {
    this.assertAllowed("set", fragment);
    if (!(this.currentBuilder instanceof UpdateSetBuilder)) {
      throw new Error(`Cannot call '${fragment}' outside of Update`);
    }
    this.currentBuilder.set(data);
    return this;
  }

  protected deleteFrom(
    table: string,
    fragment: string = "DELETE FROM"
  ) {
    this.assertAllowed("deleteFrom", fragment); 
    this.finalizePreviousStatement();
    this.currentBuilder = new DeleteFromBuilder(table);
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

  protected onDelete(
    action: ReferentialAction,
    fragment: string = "ON DELETE"
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
    fragment: string = "ON UPDATE"
  ) {
    this.assertAllowed("onUpdate", fragment);
    if (!(this.currentBuilder instanceof AlterTableBuilder)) {
      throw new Error(`Cannot call '${fragment}' outside of AlterTable`);
    }
    this.currentBuilder.onUpdate(action);
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
    predicate: PredicateNode,
    fragment: string = "WHERE",
  ) {
    this.assertAllowed("where", fragment);
    if (
      !(this.currentBuilder instanceof SelectBuilder) &&
      !(this.currentBuilder instanceof UpdateSetBuilder) &&
      !(this.currentBuilder instanceof DeleteFromBuilder)
    ) {
      throw new Error(`Cannot call '${fragment}' outside of SELECT/UPDATE/DELETE`);
    }
    this.currentBuilder.where(predicate);
    return this;
  }

  // protected eq(
  //   value: ColumnValue,
  //   fragment: string = "eq",
  // ) {
  //   this.assertAllowed("eq", fragment);

  //   if (!(this.currentBuilder instanceof WhereBuilder)) {
  //     throw new Error(`Cannot call '${fragment}' outside of WHERE clause`);
  //   }

  //   this.currentBuilder = this.currentBuilder.eq(value);

  //   return this;
  // }

  // protected ne(
  //   value: ColumnValue,
  //   fragment: string = "ne",
  // ) {
  //   this.assertAllowed("ne", fragment);

  //   if (!(this.currentBuilder instanceof WhereBuilder)) {
  //     throw new Error(`Cannot call '${fragment}' outside of WHERE clause`);
  //   }

  //   this.currentBuilder = this.currentBuilder.ne(value);

  //   return this;
  // }

  // protected gt(
  //   value: ColumnValue,
  //   fragment: string = "gt",
  // ) {
  //   this.assertAllowed("gt", fragment);

  //   if (!(this.currentBuilder instanceof WhereBuilder)) {
  //     throw new Error(`Cannot call '${fragment}' outside of WHERE clause`);
  //   }

  //   this.currentBuilder = this.currentBuilder.gt(value);

  //   return this;
  // }

  // protected gte(
  //   value: ColumnValue,
  //   fragment: string = "gte",
  // ) {
  //   this.assertAllowed("gte", fragment);

  //   if (!(this.currentBuilder instanceof WhereBuilder)) {
  //     throw new Error(`Cannot call '${fragment}' outside of WHERE clause`);
  //   }

  //   this.currentBuilder = this.currentBuilder.gte(value);

  //   return this;
  // }

  // protected lt(
  //   value: ColumnValue,
  //   fragment: string = "lt",
  // ) {
  //   this.assertAllowed("lt", fragment);

  //   if (!(this.currentBuilder instanceof WhereBuilder)) {
  //     throw new Error(`Cannot call '${fragment}' outside of WHERE clause`);
  //   }

  //   this.currentBuilder = this.currentBuilder.lt(value);

  //   return this;
  // }

  // protected lte(
  //   value: ColumnValue,
  //   fragment: string = "lte",
  // ) {
  //   this.assertAllowed("lte", fragment);

  //   if (!(this.currentBuilder instanceof WhereBuilder)) {
  //     throw new Error(`Cannot call '${fragment}' outside of WHERE clause`);
  //   }

  //   this.currentBuilder = this.currentBuilder.lte(value);

  //   return this;
  // }

  // protected and(
  //   column: string,
  //   fragment: string = "AND",
  // ) {
  //   this.assertAllowed("and", fragment);

  //   if (
  //     !(this.currentBuilder instanceof SelectBuilder) // TODO add updatesetbuilder and delete
  //   ) {
  //     throw new Error(`Cannot call '${fragment}' outside of WHERE clause`);
  //   }

  //   this.currentBuilder = this.currentBuilder.and(column);
    
  //   return this;
  // }

  // protected or(
  //   column: string,
  //   fragment: string = "OR",
  // ) {
  //   this.assertAllowed("or", fragment);

  //   if (
  //     !(this.currentBuilder instanceof SelectBuilder) // TODO add updatesetbuilder and delete
  //   ) {
  //     throw new Error(`Cannot call '${fragment}' outside of WHERE clause`);
  //   }

  //   this.currentBuilder = this.currentBuilder.or(column);
    
  //   return this;
  // }

  protected and(left: PredicateNode, right: PredicateNode) {   
    return new BinaryLogicalPredicateNode(
      left,
      right,
      "and",
    );
  }

  protected or(left: PredicateNode, right: PredicateNode) {   
    return new BinaryLogicalPredicateNode(
      left,
      right,
      "or",
    );
  }

  protected xor(left: PredicateNode, right: PredicateNode) {   
    return new BinaryLogicalPredicateNode(
      left,
      right,
      "xor",
    );
  }

  protected not(inner: PredicateNode) {   
    return new NotPredicateNode(
      inner,
    );
  }

  protected case() {   
    return new CaseBuilder();
  }

  protected column(
    name: string,
  ) {
    return new ColumnExpressionNode(name);
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