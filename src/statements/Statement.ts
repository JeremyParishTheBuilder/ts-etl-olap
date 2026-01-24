import { type BeginStatement } from "./session/BeginStatement.js";
import { type CommitStatement } from "./session/CommitStatement.js";
import { type UseDatabaseStatement } from "./session/UseDatabaseStatement.js";
import { type CreateDatabaseStatement } from "./ddl/CreateDatabaseStatement.js";
import { type CreateTableStatement } from "./ddl/CreateTableStatement.js";
import { type AlterTableStatement } from "./ddl/AlterTableStatement.js";
import { type InsertIntoStatement } from "./dml/InsertIntoStatement.js";

export interface BaseStatement {
  readonly kind: StatementKind;
}

export type StatementKind =
  | "begin"
  | "commit"
  | "create_database"
  | "use_database"
  | "create_table"
  | "alter_table"
  | "insert_into";

export type Statement =
  | BeginStatement
  | CommitStatement
  | CreateDatabaseStatement
  | UseDatabaseStatement
  | CreateTableStatement
  | AlterTableStatement
  | InsertIntoStatement;

export interface StatementBuilder {
  createStatement(): Statement;
  getNextCalls(): {
    required: string[];
    optional: string[];
  };
}