import type { JoinStatement } from "../../statements/dql/join/JoinStatement.js";
import type { QueryStatement } from "../../statements/dql/QueryStatement.js";

export interface TableReference {
  kind: "table";
  name: string;
  alias?: string;
}

export interface QueryReference {
  kind: "query";
  query: QueryStatement;
  alias?: string;
}

export interface JoinReference {
  kind: "join";
  join: JoinStatement;
}

export type RelationSource = TableReference | QueryReference | JoinReference;
