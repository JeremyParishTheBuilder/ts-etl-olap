import type { QueryStatement } from "./QueryStatement.js";
import { RelationSourceReferencer } from "./RelationSourceReferencer.js";
import type { UnionAllStatement } from "./setOperations/UnionAllStatement.js";

export abstract class QueryStatementBuilder extends RelationSourceReferencer {
  unionAll(query: QueryStatement) {
    return new UnionAllBuilder(this.createStatement(), query);
  }

  getNextCalls(): {
    required: string[];
    optional: string[];
  } {
    const calls = super.getNextCalls();

    if (calls.required.length === 0) {
      calls.optional.push("unionAll");
    }

    return calls;
  }

  abstract createStatement(): QueryStatement;
}

export class UnionAllBuilder extends QueryStatementBuilder {
  constructor(
    private left: QueryStatement,
    private right: QueryStatement,
  ) {
    super();
  }

  createStatement(): UnionAllStatement {
    return {
      kind: "unionAll",
      left: this.left,
      right: this.right,
    };
  }
}
