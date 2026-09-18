import type { StatementBuilder } from "../Statement.js";
import type { QueryStatement } from "./QueryStatement.js";
import type { UnionAllStatement } from "./UnionAllStatement.js";

export abstract class QueryStatementBuilder implements StatementBuilder {
  unionAll(query: QueryStatement) {
    return new UnionAllBuilder(this.createStatement(), query);
  }

  getNextCalls(): {
    required: string[];
    optional: string[];
  } {
    return {
      required: [],
      optional: ["unionAll"],
    };
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

  getNextCalls() {
    return {
      required: [],
      optional: ["unionAll"],
    };
  }

  createStatement(): UnionAllStatement {
    return {
      kind: "unionAll",
      left: this.left,
      right: this.right,
    };
  }
}
