import { type BaseStatement, type StatementBuilder } from "../Statement.js";
import { type PredicateNode } from "../../ast/predicate/PredicateNode.js";
import type { ExpressionNode } from "../../ast/expression/ExpressionNode.js";
import type { UpdateInput } from "../../types/UpdateInput.js";
import { DefaultValueNode } from "../../ast/DefaultValueNode.js";
import { toExpressionNode } from "../../semantic/toExpressionNode.js";

export interface UpdateSetStatement extends BaseStatement {
  kind: "update_set";
  table: string;
  values: Record<string, ExpressionNode | DefaultValueNode>;
  where?: PredicateNode;
  returning?: string[];
}

export class UpdateSetBuilder implements StatementBuilder {
  private values?: Record<string, ExpressionNode | DefaultValueNode>;
  private whereClause?: PredicateNode;
  private returningCols?: string[];

  constructor(private table: string) {}

  set(data: Record<string, UpdateInput>) {
    const normalized: Record<string, ExpressionNode | DefaultValueNode> = {};

    for (const key in data) {
      normalized[key] = toExpressionNode(data[key]);
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
    if (!this.values)
      return {
        required: ["set"],
        optional: [],
      };

    if (!this.whereClause)
      return {
        required: [],
        optional: ["where", "returning"],
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
      returning: this.returningCols,
    };
  }
}
