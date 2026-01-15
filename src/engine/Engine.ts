import { type InlineColumnSpec } from "../types/Column.js";
import {
  type ConstraintSpec,
  CONSTRAINT_KIND
} from "../types/Constraint.js";
import type { ColumnRef } from "../types/ColumnRef.js";
import type { RowId } from "../types/RowId.js";
import { ID } from "../constants.js";
import { Database } from "../types/Database.js";
import { DatabaseContainer } from "../types/DatabaseContainer.js";
import { Table } from "../types/Table.js";
import { Dialect, DialectRules, DIALECT_RULES } from "../dialect/index.js";
import { EnginePolicy, defaultPolicy/*, defaultPolicyForDialect*/ } from "./EnginePolicy.js";
//import { ResolvedRules, resolveRules } from "./ResolvedRules";
import { RuleResolver } from "./RuleResolver.js";
import { RulesFacadeShape, RulesFacade } from "./RulesFacade.js";
import { EngineContext } from "./EngineContext.js";
import { Resolver } from "./Resolver.js";
import { InputBatch } from "./InputBatch.js";
import { TransactionContext } from "./TransactionContext.js";
import {
  Statement,
  BeginTransactionStatement,
  CommitTransactionStatement,
  CreateDatabaseStatement,
  UseDatabaseStatement,
  CreateTableStatement,
  AlterTableStatement,
  //DropTableStatement,
} from "../statements/index.js";
import { InsertIntoStatement } from "../statements/dml/InsertIntoStatement.js";

export class Engine extends DatabaseContainer {
  readonly resolver: Resolver;
  public readonly dialect: Dialect;
  public readonly dialectRules: DialectRules;
  public policy: EnginePolicy;

  readonly rules: RulesFacadeShape;
  private readonly ruleResolver: RuleResolver;

  //  <construction>
  constructor(dialect: Dialect, policy?: Partial<EnginePolicy>) {
    super()

    this.resolver = new Resolver(this);

    this.dialect = dialect;
    this.dialectRules = DIALECT_RULES[dialect];

    this.policy = policy ?? {}; //structuredClone(defaultPolicyForDialect(dialect));
    // this.policy = {
    //   ...defaultPolicy(),   // engine/dialect defaults
    //   ...policy                  // user overrides
    // };

    this.ruleResolver = new RuleResolver(this.dialect, this.policy);
    this.rules = RulesFacade(this.ruleResolver);
  }

  static create(dialect: Dialect): Engine {
    if (!(dialect in DIALECT_RULES)) {
      throw new Error(`Unsupported dialect: ${dialect}`);
    }
    return new Engine(dialect);
  }
  //  </construction>

  //  <rules>
  // get rules(): ResolvedRules {
  //   return resolveRules(this.dialectRules, this.policy);
  // }
  updatePolicy(update: Partial<EnginePolicy>) {
    this.ruleResolver.updatePolicy(update);
  }
  //  </rules>

  //  <input batch>
  private inputBatch?: InputBatch;

  input(): InputBatch {
    if (!this.inputBatch) {
      this.inputBatch = new InputBatch(this);
    }
    return this.inputBatch;
  }

  execute() {
    if (!this.inputBatch) return;
    this.inputBatch.execute();
    this.inputBatch = undefined; // clear batch after execution
  }
  //  <input batch>

  //  <transaction>
  private latestTxId = 0;
  private nextTxId(): number {
    return ++this.latestTxId;
  }

  private txHistory = new Map<number, Statement<any>[]>();

  private _currentTransaction?: TransactionContext;
  getTx(): TransactionContext | undefined {
    return this._currentTransaction;
  }

  beginTx(): void {
    if (this._currentTransaction) {
      throw new Error("Transaction already in progress");
    }
    this._currentTransaction = new TransactionContext(this.rules.transaction.trackStatementHistory());
  }

  commitTx(): void {
    if (!this._currentTransaction) {
      throw new Error("No active transaction to commit");
    }

    const txId = this.nextTxId();
    this._currentTransaction.commit(
      this,
      new EngineContext(
        this.resolver,
        this.rules,
        txId
      )
    );
    if (this.rules.transaction.trackStatementHistory()) {
      this.txHistory.set(txId, [...this._currentTransaction.stmts]);
    }
    this._currentTransaction = undefined;
  }

  rollbackTx(): void {
    if (!this._currentTransaction) return;
    this._currentTransaction = undefined;
  }
  //  </transaction>

  // engine-level statmenets
  begin() {
    this.input().addStatement(new BeginTransactionStatement);
    return this;
  }

  commit() {
    this.input().addStatement(new CommitTransactionStatement);
    return this;
  }

  createDatabase(name: string) {
    this.input().addStatement(new CreateDatabaseStatement(name));
    return this;
  }

  use(name: string) {
    this.input().addStatement(new UseDatabaseStatement(name));
    return this;
  }
  //TODO:
  //alterDatabase
  //showDatabases

  // database-level statements
  createTable(
    name: string,
    columnSchema: Record<string, InlineColumnSpec>,
    constraintSchema?: Record<string, ConstraintSpec>
  ) {
    this.input().addStatement(new CreateTableStatement(name, columnSchema, constraintSchema));
    return this;
  }

  dropTable(name: string) {
    //this.input().addStatement(new DropTableStatement(name)); // TODO: write DropTableStatement
  }



  //Query
  //select(cols: any[]) { return new Select(this.currentDatabase, [], cols); }
  //with(name: string, subquery: Query) { return new With(this.currentDatabase, [[name, subquery]]); }
  
  

  // table-level statements
  alterTable(name: string) {
    // this.input().addStatement(new AlterTableStatement(name));
    // return this;
    return new AlterTableStatement(name);
  }

  insertInto(table: string, columns?: string[]) {
    return new InsertIntoStatement(table, columns);
    // this.input().addStatement(new InsertIntoStatement(table, columns));
    // return this;
  }
}

interface HasTargetName {
  getTargetName(): string;
}



abstract class Query {
  abstract query(): Table | undefined;
  print(): void {
    console.log(this.query());
  }
}

// class AlterTable extends Statement<Table> implements HasTargetName {
//   constructor(
//     public table: string,
//   ) {
//     super();
//   }
//   getTargetName() { return this.table; }

//   add(name: string, column: Column) {
//     this.actions.push(new AddColumn(this.table, name, column));
//     return this;
//   }

//   dropColumn(name: string): this {
//     this.actions.push(new DropColumn(this.table, name));
//     return this;
//   }

//   renameColumn(oldName: string, newName: string): this {
//     this.actions.push(new RenameColumn(this.table, oldName, newName));
//     return this;
//   }

//   alterColumn(name: string, column: Column) {
//     this.actions.push(new AlterColumn(this.table, name, column));
//     return this;
//   }

//   addPrimaryKey(column: string) {
//     this.actions.push(new AddPrimaryKey(this.table, column));
//     return this;
//   }

//   dropPrimaryKey(column: string) {
//     this.actions.push(new DropPrimaryKey(this.table));
//     return this;
//   }

//   addConstraint(name: string) {
//     return new AddConstraint(this, name);
//   }

// }

// class AddPrimaryKey implements Action {
//   constructor(
//     private table: string,
//     private column: string
//   ) {}

//   apply(ctx: EngineContext) {
//     ctx.resolver.resolveTable(this.table).addPrimaryKey(this.column, [this.column]);
//   }
// }

// class DropPrimaryKey implements Action {
//   constructor(
//     private table: string
//   ) {}

//   apply(ctx: EngineContext) {
//     ctx.resolver.resolveTable(this.table).dropPrimaryKey();
//   }
// }

// class AddColumn implements Action {
//   constructor(
//     private table: string,
//     private name: string,
//     private column: Column
//   ) {}

//   apply(ctx: EngineContext) {
//     ctx.resolver.resolveTable(this.table).add(this.name, this.column);
//   }
// }

// class DropColumn implements Action {
//   constructor(
//     private table: string,
//     private name: string
//   ) {}

//   apply(ctx: EngineContext) {
//     ctx.resolver.resolveTable(this.table).dropColumn(this.name);
//   }
// }

// class RenameColumn implements Action {
//   constructor(
//     private table: string,
//     private oldName: string,
//     private newName: string
//   ) {}

//   apply(ctx: EngineContext) {
//     ctx.resolver.resolveTable(this.table).renameColumn(this.oldName, this.newName);
//   }
// }

// class AlterColumn implements Action {
//   constructor(
//     private table: string,
//     private name: string,
//     private column: Column
//   ) {}

//   apply(ctx: EngineContext) {
//     ctx.resolver.resolveTable(this.table).alterColumn(this.name, this.column);
//   }
// }

// abstract class Fragment<S extends Statement<any>> {
//   constructor(
//     protected statement: S
//   ) {}
// }

// class AddConstraint<T extends Statement<Table> & HasTargetName> extends Fragment<T> {
//   constructor(
//     protected statement: T,
//     public name: string,
//   ) {
//     super(statement);
//   }

//   unique(columns: string[]): T {
//     this.statement.addAction(
//       new AddUnique(this.statement.getTargetName(), this.name, columns)
//     );
//     return this.statement;
//   }

//   foreignKey(columns: string[]): AddForeignKey<T> {
//     return new AddForeignKey(this.statement, this.name, columns);
//   }
// }

// class AddUnique implements Action {
//   constructor(
//     private table: string,
//     private name: string,
//     private columns: string[]
//   ) {}

//   apply(ctx: EngineContext) {
//     const table = ctx.resolver.resolveTable(this.table);
//     table.addUnique(this.name, this.columns);
//   }
// }

// class AddForeignKey<T extends Statement<Table> & HasTargetName> extends Fragment<T> {
//   constructor(
//     protected statement: T,
//     private name: string,
//     private childColumns: string[]
//   ) {
//     super(statement);
//   }

//   references(parentTable: string, parentColumns: string[]) {
//     this.statement.addAction(
//       new AddForeignKeyAction(
//         this.name,
//         this.statement.getTargetName(),
//         this.childColumns,
//         parentTable,
//         parentColumns
//       )
//     );
//   }
// }

// class AddForeignKeyAction implements Action {
//   constructor(
//     private name: string,
//     private childTable: string,
//     private childColumns: string[],
//     private parentTable: string,
//     private parentColumns: string[]
//   ) {}
//   apply(ctx: EngineContext) {
//     const spec: ConstraintSpec = {
//       kind: CONSTRAINT_KIND.foreignKey,
//       name: this.name,
//       constraint: {
//         columns: this.childColumns,
//         parentTable: this.parentTable,
//         parentColumns: this.parentColumns
//       }
//     }

//     ctx.validate.addConstraint(
//       this.childTable,
//       spec
//     );

//     ctx.resolver.resolveTable(true, this.childTable).addConstraint(spec);
//   }
// }

function validateAddForeignKey(
  name: string,
  childTable: Table,
  childColumns: string[],
  parentTable: Table,
  parentColumns: string[],
  rules: DialectRules
) {

  if (!name) throw new Error("Foreign key name is required");
  if (!childColumns || childColumns.length === 0) {
    throw new Error("Foreign key columns required"); }
  if (!parentTable) throw new Error("Foreign key Parent Table name is required");
  if (!parentColumns || parentColumns.length === 0) {
    throw new Error("Foreign key Parent columns required"); }
  if (childColumns.length !== parentColumns.length) {
    throw new Error(`Column length mismatch.`); }

  //confirm columns exist on each table
  //confirm parent table primary key exists, and its columns match parentColumns
  //make sure foreignColumns and localColumns types match
  //index existing local values
    //check that they exist on foreign table (or null)
  //TODO

}

// class References implements Action<Table> {
//   constructor(
//     private name: string,
//     private localColumns: string[],
//     private table: string,
//     private foreignColumns: string[]
//   ) {}

//   apply(table: Table) { // TODO, how pass in db?
//     table.addForeignKey(this.name, this.localColumns, this.table, this.foreignColumns);
//   }
// }


// let db = new Database();
// db.createTable("RegistryRoot", {
//   name: { type: String }
// });

// db.tables.get("RegistryRoot")?.addRow({ name: "Cosmos Chain Registry" })

// db.createTable("NetworkKind", {
//   parentId: { type: Number, foreignKey: { table: "RegistryRoot", column: ID } },
//   networkKind: { type: String/*, enum: ["mainnets", "testnets"]*/ }
// });

// let ccrRootKey = db.
//   select([ID]).
//   from("RegistryRoot").
//   where(
//     {
//       kind: "pred",
//       fn: (rowId: RowId, table: Table) => {
//         return table.data.get("name")?.[rowId] === "Cosmos Chain Registry" //needs fix
//       }
//     }
//   ).query()?.data.get(ID)?.[0];

// db.tables.get("NetworkKind")?.addRow({ parentId: ccrRootKey, networkKind: "mainnets" });
// db.tables.get("NetworkKind")?.addRow({ parentId: ccrRootKey, networkKind: "testnets" });




type Expr = // Expression
  | { kind: "pred"; fn: Predicate };
  //| { kind: "and"; left: Expr; right: Expr }
  //| { kind: "or"; left: Expr; right: Expr }
  //| { kind: "not"; expr: Expr;};

type Predicate = (rowId: RowId, table: Table) => boolean;

// export class With {
//   constructor(
//     public db: Database,
//     public ctes: any[] //CTE = Common table expression
//   ) {}

//   with(name: string, subquery: Query) {
//     return new With(this.db, [...this.ctes, [name, subquery]]);
//   }

//   select(cols: string[]) {
//     return new Select(this.db, this.ctes, cols);
//   }
// }

// export class Select {
//   constructor(
//     public db: string | undefined,
//     public ctes: any[],
//     public cols: string[]
//   ) {}

//   from(table: string) {
//     return new From(this.db, this.ctes, this.cols, table);
//   }
// }



export class From extends Query {
  constructor(
    public db: Database,
    public ctes: unknown[],
    public cols: string[],
    public table: string
) {
  super();
}

  where(expr: Expr) {
    return new Where(this.db, this.ctes, this.cols, this.table, expr);
  }

  query(): Table | undefined {
    return this.db.tables.get(this.table);
  }

}

export class Where extends Query {
  constructor(
    public db: Database,
    public ctes: any[],
    public cols: string[],
    public table: string,
    public expr: Expr
  ) {
    super();
  }

  //feeling silly--might delete later ;p
  // and(p: Expr): Where {
  //   return new Where(
  //     this.db,
  //     this.ctes,
  //     this.cols,
  //     this.table,
  //     { kind: "and", left: this.expr, right: p }
  //   );
  // }

  query(): Table | undefined {
    let tableData: Table | undefined = new From(this. db, this.ctes, this.cols, this.table).query();
    if (!tableData) return;

    // const filteredRowIds: RowId[] = (tableData.data.get(ID) as RowId[]).filter(rowId =>
    //   this.expr.fn(rowId, tableData);
    // );

    //TODO, write query function
    //Decide whether to create a copy of a table, and then filter that out vs
    // ...return just an array of ids??

    //copy table

    // (tableData.data.get(ID) as RowId[]).forEach(rowId => {
    //   if (!this.expr.fn(rowId, tableData)) tableData.deleteRow(rowId);
    // });

    //return filteredRowIds;
    return;
  }

}