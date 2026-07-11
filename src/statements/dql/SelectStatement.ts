import { type PredicateNode } from "../../semantic/ast/predicate/PredicateNode.js";
import { type BaseStatement, type StatementBuilder } from "../Statement.js";

export interface SelectStatement extends BaseStatement {
  kind: "select",
  tableName: string;
  columnNames: string[] | '*';
  where?: PredicateNode;
}

export class SelectBuilder implements StatementBuilder {
  private tableName?: string;
  private whereClause?: PredicateNode;

  constructor(
    private columnNames: string[] | "*" = [],
  ) {}

  from(tableName: string) {
    this.tableName = tableName;
  }

  where(predicate: PredicateNode) {
    this.whereClause = predicate;
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
      optional: [],
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
      where: this.whereClause,
    };
  }
}