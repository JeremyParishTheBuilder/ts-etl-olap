import type { InnerJoinStatement } from "./InnerJoinStatement.js";
import type { LeftJoinStatement } from "./LeftJoinStatement.js";
import type { FullJoinStatement } from "./FullJoinStatement.js";
import type { RightJoinStatement } from "./RightJoinStatement.js";
import type { PredicateNode } from "../../../ast/predicate/PredicateNode.js";
import type { TabularExpressionReferencer } from "../TabularExpressionReferencer.js";
import type { StatementBuilder } from "../../Statement.js";

export type JoinStatement =
  | InnerJoinStatement
  | LeftJoinStatement
  | RightJoinStatement
  | FullJoinStatement;

export abstract class JoinBuilder implements StatementBuilder {
  abstract on(predicate?: PredicateNode): TabularExpressionReferencer;
  abstract getNextCalls(): { required: string[]; optional: string[] };
  abstract createStatement(): JoinStatement;
}
