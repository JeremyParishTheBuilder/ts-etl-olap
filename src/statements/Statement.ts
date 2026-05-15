import { type BeginStatement } from "./session/BeginStatement.js";
import { type CommitStatement } from "./session/CommitStatement.js";
import { type UseDatabaseStatement } from "./session/UseDatabaseStatement.js";
import { type CreateDatabaseStatement } from "./ddl/CreateDatabaseStatement.js";
import { type CreateTableStatement } from "./ddl/CreateTableStatement.js";
import { type AlterTableStatement } from "./ddl/AlterTableStatement.js";
import { type InsertIntoStatement } from "./dml/InsertIntoStatement.js";
import { type SelectStatement } from "./dql/SelectStatement.js";
import { type UpdateSetStatement } from "./dml/UpdateSetStatement.js";
import { type WhereStatement } from "./dql/WhereColumnBuilder.js";

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
  | "insert_into"
  | "update_set"
  | "select"
  | "where";

export type Statement =
  | BeginStatement
  | CommitStatement
  | CreateDatabaseStatement
  | UseDatabaseStatement
  | CreateTableStatement
  | AlterTableStatement
  | InsertIntoStatement
  | UpdateSetStatement
  | SelectStatement
  | WhereStatement;

export interface StatementBuilder extends Builder {
  createStatement(): Statement;
}

export interface Builder {
  getNextCalls(): {
    required: string[];
    optional: string[];
  };
}

export function isStatementBuilder(b: Builder): b is StatementBuilder {
  return "createStatement" in b;
}