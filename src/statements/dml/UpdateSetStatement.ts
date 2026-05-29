import { type BaseStatement, type StatementBuilder } from "../Statement.js";
import { type ColumnValue } from "../../schema/Column.js"
import { type WhereClause } from "../WhereClause.js";
import { WhereColumnBuilder } from "../dql/WhereColumnBuilder.js";

//type WhereClause = { column: string };


type Keyword = "DEFAULT";
//TODO, define in it's own file
type ExplicitInput =
  | ColumnValue
  | Keyword;

export interface UpdateSetStatement extends BaseStatement {
  kind: "update_set",
  table: string,
  values: Record<string, ExplicitInput>,//{column: string, value: ColumnValue}[],
  where?: WhereClause,
  returning?: string[],
}

export class UpdateSetBuilder implements StatementBuilder {
  private values?: Record<string, ExplicitInput>;
  private whereClause?: WhereClause;
  private returningCols?: string[];

  constructor(
    private table: string,
    private columns: string[] = [],
  ) {}

  set(data: Record<string, ExplicitInput>) {
    this.values = data;
  }

  where(column: string): WhereColumnBuilder {
    return new WhereColumnBuilder(this, column);
  }

  and(column: string): WhereColumnBuilder {
    return new WhereColumnBuilder(this, column, "and");
  }
  
  or(column: string): WhereColumnBuilder {
    return new WhereColumnBuilder(this, column, "or");
  }

  addWhereClause(clause: WhereClause, logicalOp?: "and" | "or") {
    if (!this.whereClause) {
      this.whereClause = clause;
      return;
    }

    if (!logicalOp) {
      throw new Error("Missing logical operator (and/or)");
    }

    this.whereClause = {
      type: "logical",
      operator: logicalOp,
      left: this.whereClause,
      right: clause,
    };
  }

  returning(cols: string[]) {
    if (!this.values) {
      throw new Error(`Cannot call returning() before values()`);
    }

    this.returningCols = cols;
  }

  getNextCalls() {
    if (!this.values) return {
      required: ["set"],
      optional: []
    };

    if (!this.whereClause) return {
      required: [],
      optional: ["where", "returning"]
    };

    return {
      required: [],
      optional: ["and", "or", "returning"],
    };
  }

  createStatement(): UpdateSetStatement {
    if (!this.values) {
      throw new Error("Missing required call: set()");
    }

    return {
      kind: "update_set",
      table: this.table,
      values: this.values,
      where: this.whereClause,
      returning: this.returningCols
    };
  }

}
