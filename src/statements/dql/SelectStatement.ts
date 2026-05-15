import { type ColumnValue } from "../../schema/Column.js";
import { type BaseStatement, type StatementBuilder } from "../Statement.js";
import { type ComparisonOperator, type WhereClause } from "../WhereClause.js";
import { WhereColumnBuilder } from "./WhereColumnBuilder.js";

export interface SelectStatement extends BaseStatement {
  kind: "select",
  tableName: string;
  columnNames: string[] | '*';
  whereClause?: WhereClause;
}

export class SelectBuilder implements StatementBuilder {
  private tableName?: string;
  private whereClause?: WhereClause;

  constructor(
    private columnNames: string[] | "*" = [],
  ) {}

  from(tableName: string) {
    this.tableName = tableName;
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
    //Constructs a left-associative tree by default
    //Must use whereGroup to more precisely build clauses
  }

  //TODO, think thru this later
  whereGroup(builderFn: (qb: SelectBuilder) => void) {
    const subBuilder = new SelectBuilder();

    builderFn(subBuilder);

    if (!subBuilder.whereClause) {
      throw new Error("Empty where group");
    }

    this.whereClause = this.whereClause
      ? {
          type: "logical",
          operator: "and",
          left: this.whereClause,
          right: subBuilder.whereClause,
        }
      : subBuilder.whereClause;

    return this;
  }

  getNextCalls() {
    if (!this.tableName) return {
      required: ["from"],
      optional: []
    };
    if (!this.whereClause) return {
      required: [],
      optional: ["where"]
    };
    
    return {
      required: [],
      optional: ["and", "or"],
    };
  }
  
  createStatement(): SelectStatement {
    if (!this.tableName) {
      throw new Error("Missing required call: from()");
    }

    return {
      kind: "select",
      tableName: this.tableName,
      columnNames: this.columnNames,
      whereClause: this.whereClause,
    };
  }
}