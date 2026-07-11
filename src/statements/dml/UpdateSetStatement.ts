import { type BaseStatement, type StatementBuilder } from "../Statement.js";
import { type ExpressionNode } from "../../evaluation/expression/Expression.js";
import { asExpressionNode } from "../../dsl/expression/asExpressionNode.js";
import { type ExplicitInput } from "../../types/ExplicitInput.js";
import { type PredicateNode } from "../../semantic/ast/predicate/PredicateNode.js";

export interface UpdateSetStatement extends BaseStatement {
  kind: "update_set",
  table: string,
  values: Record<string, ExpressionNode>,
  where?: PredicateNode,
  returning?: string[],
}

export class UpdateSetBuilder implements StatementBuilder {
  private values?: Record<string, ExpressionNode>;
  private whereClause?: PredicateNode;
  private returningCols?: string[];

  constructor(
    private table: string,
  ) {}

  set(data: Record<string, ExpressionNode | ExplicitInput>) {
    const normalized: Record<string, ExpressionNode> = {};

    for (const key in data) {
      normalized[key] =
        asExpressionNode(data[key]);
    }

    this.values = normalized;
  }

  where(predicate: PredicateNode) {
    this.whereClause = predicate;
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
      optional: ["returning"],
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
