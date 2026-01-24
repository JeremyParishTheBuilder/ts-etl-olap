import { DatabaseContainer } from "../types/DatabaseContainer.js";
import { Resolver } from "./Resolver.js";
import { Dialect, type DialectRules, DIALECT_RULES } from "../dialect/index.js";
import { type EnginePolicy } from "./EnginePolicy.js";
import { RuleResolver } from "./RuleResolver.js";
import { RulesFacadeShape, RulesFacade } from "./RulesFacade.js";

import { type InputBatch } from "../input/InputBatch.js";
import { PostgresInputBatch } from "../input/PostgresInputBatch.js";
import { SqlServerInputBatch } from "../input/SqlServerInputBatch.js";
import { MySqlInputBatch } from "../input/MySqlInputBatch.js";

import { EngineContext } from "./EngineContext.js";
import { TransactionContext } from "./TransactionContext.js";

import { type Statement } from "../statements/index.js";

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

    this.policy = policy ?? {};

    this.ruleResolver = new RuleResolver(this.dialect, this.policy);
    this.rules = RulesFacade(this.ruleResolver);
  }

  static create(dialect: Dialect): Engine {
    if (!(dialect in DIALECT_RULES)) {
      throw new Error(`Unsupported dialect: ${dialect}`);
    }
    return new Engine(dialect);
  }

  updatePolicy(update: Partial<EnginePolicy>) {
    this.ruleResolver.updatePolicy(update);
  }

  //  <input batch>
  private inputBatch?: InputBatch;

  public input(): InputBatch {
    if (!this.inputBatch) {
      this.inputBatch = this.createInputBatch();
    }
    return this.inputBatch;
  }

  private createInputBatch(): InputBatch {
    switch (this.dialect) {
      case Dialect.Postgres:
        return new PostgresInputBatch(
          this.rules,
          this.beginTx.bind(this),
          this.commitTx.bind(this),
          this.getTx.bind(this)
        );

      case Dialect.SQLServer:
        return new SqlServerInputBatch(
          this.rules,
          this.beginTx.bind(this),
          this.commitTx.bind(this),
          this.getTx.bind(this)
        );

      case Dialect.MySQL:
        return new MySqlInputBatch(
          this.rules,
          this.beginTx.bind(this),
          this.commitTx.bind(this),
          this.getTx.bind(this)
        );

      default:
        throw new Error(`InputBatch for Dialect: ${this.dialect} not supported`);
    }
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

  private txHistory = new Map<number, Statement[]>();

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

  //TODO:
  //alterDatabase
  //showDatabases

  // database-level statements
  dropTable(name: string) {} // TODO


  //Query
  //select(cols: any[]) { return new Select(this.currentDatabase, [], cols); }
  //with(name: string, subquery: Query) { return new With(this.currentDatabase, [[name, subquery]]); }

}


// abstract class Query {
//   abstract query(): Table | undefined;
//   print(): void {
//     console.log(this.query());
//   }
// }



// type Expr = // Expression
//   | { kind: "pred"; fn: Predicate };
  //| { kind: "and"; left: Expr; right: Expr }
  //| { kind: "or"; left: Expr; right: Expr }
  //| { kind: "not"; expr: Expr;};

//type Predicate = (rowId: RowId, table: Table) => boolean;

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



// export class From extends Query {
//   constructor(
//     public db: Database,
//     public ctes: unknown[],
//     public cols: string[],
//     public table: string
// ) {
//   super();
// }

//   where(expr: Expr) {
//     return new Where(this.db, this.ctes, this.cols, this.table, expr);
//   }

  // query(): Table | undefined {
  //   return this.db.tables.get(this.table);
  // }

//}

// export class Where extends Query {
//   constructor(
//     public db: Database,
//     public ctes: any[],
//     public cols: string[],
//     public table: string,
//     public expr: Expr
//   ) {
//     super();
//   }

//   //feeling silly--might delete later ;p
//   // and(p: Expr): Where {
//   //   return new Where(
//   //     this.db,
//   //     this.ctes,
//   //     this.cols,
//   //     this.table,
//   //     { kind: "and", left: this.expr, right: p }
//   //   );
//   // }

//   query(): Table | undefined {
//     let tableData: Table | undefined = new From(this. db, this.ctes, this.cols, this.table).query();
//     if (!tableData) return;

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
//     return;
//   }

// }