import type { RelationSource } from "../../semantic/relation/RelationSource.js";
import type { Statement, StatementBuilder } from "../Statement.js";
import { InnerJoinBuilder } from "./join/InnerJoinStatement.js";
import type { QueryStatement } from "./QueryStatement.js";

export abstract class RelationSourceReferencer implements StatementBuilder {
  protected source?: RelationSource;

  from(source: string | QueryStatement, alias?: string) {
    this.source = createRelationSource(source, alias);
  }

  innerJoin(right: string | QueryStatement, alias?: string) {
    if (!this.source) {
      throw new Error(`No Left Relation Source`);
    }

    return new InnerJoinBuilder(
      this.source,
      createRelationSource(right, alias),
      this,
    );
  }

  withSource(source: RelationSource): this {
    this.source = source;
    return this;
  }

  getNextCalls(): {
    required: string[];
    optional: string[];
  } {
    return {
      required: [],
      optional: ["innerJoin", "leftJoin", "rightJoin", "fullJoin"],
    };
  }

  abstract createStatement(): Statement;
}

function createRelationSource(
  source: string | QueryStatement,
  alias?: string,
): RelationSource {
  if (typeof source === "string") {
    return {
      kind: "table",
      name: source,
      alias,
    };
  }

  return {
    kind: "query",
    query: source,
    alias,
  };
}
