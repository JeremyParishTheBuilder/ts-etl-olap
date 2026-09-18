import { type BaseStatement } from "../Statement.js";
import { type QueryStatement } from "./QueryStatement.js";

export interface UnionAllStatement extends BaseStatement {
  kind: "unionAll";
  left: QueryStatement;
  right: QueryStatement;
}
