import type { PredicateNode } from "../../../ast/predicate/PredicateNode.js";
import { type BaseStatement } from "../../Statement.js";
import {
  type JoinReference,
  type RelationSource,
} from "../../../semantic/relation/RelationSource.js";
import { JoinBuilder, JoinStatement } from "./JoinStatement.js";
import type { RelationSourceReferencer } from "../RelationSourceReferencer.js";

export interface InnerJoinStatement extends BaseStatement {
  kind: "innerJoin";
  left: RelationSource;
  right: RelationSource;
  on: PredicateNode;
}

export class InnerJoinBuilder extends JoinBuilder {
  private predicate?: PredicateNode;

  constructor(
    private left: RelationSource,
    private right: RelationSource,
    private outerSelectBuilder: RelationSourceReferencer,
  ) {
    super();
  }

  on(predicate: PredicateNode): RelationSourceReferencer {
    this.predicate = predicate;

    return this.outerSelectBuilder.withSource(
      createJoinReference(this.createStatement()),
    );
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

function createJoinReference(joinStatement: JoinStatement): JoinReference {
  return {
    kind: "join",
    join: joinStatement,
  };
}
