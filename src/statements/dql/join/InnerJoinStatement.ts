import type { PredicateNode } from "../../../ast/predicate/PredicateNode.js";
import { type BaseStatement } from "../../Statement.js";
import { JoinBuilder } from "./JoinStatement.js";
import type { TabularExpressionReferencer } from "../TabularExpressionReferencer.js";
import type { TabularExpressionProjection } from "../../../ast/tabular/TabularExpressionNode.js";
import { JoinNode } from "../../../ast/tabular/JoinNode.js";

export interface InnerJoinStatement extends BaseStatement {
  kind: "innerJoin";
  left: TabularExpressionProjection;
  right: TabularExpressionProjection;
  on: PredicateNode;
}

export class InnerJoinBuilder extends JoinBuilder {
  private predicate?: PredicateNode;

  constructor(
    private left: TabularExpressionProjection,
    private right: TabularExpressionProjection,
    private outerQueryBuilder: TabularExpressionReferencer,
  ) {
    super();
  }

  on(predicate: PredicateNode): TabularExpressionReferencer {
    this.predicate = predicate;

    return this.outerQueryBuilder.withSource(this.createNode());
  }

  getNextCalls() {
    if (!this.predicate) {
      return {
        required: ["on"],
        optional: [],
      };
    }
    return {
      required: [],
      optional: [],
    };
  }

  createNode(): JoinNode {
    if (!this.predicate) {
      throw new Error(`'On' Predicate required for Inner Join`);
    }

    return new JoinNode("inner", this.left, this.right, this.predicate);
  }

  createStatement(): InnerJoinStatement {
    if (!this.predicate) {
      throw new Error(`'On' Predicate required for Inner Join`);
    }

    return {
      kind: "innerJoin",
      left: this.left,
      right: this.right,
      on: this.predicate,
    };
  }
}
