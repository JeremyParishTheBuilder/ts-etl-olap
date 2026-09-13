import { type BaseStatement } from "../Statement.js";
import { type QueryStatement } from "./QueryStatement.js";
import { QueryStatementBuilder } from "./QueryStatementBuilder.js";

export interface UnionAllStatement extends BaseStatement {
  kind: "unionAll";
  left: QueryStatement;
  right: QueryStatement;
}

export class UnionAllBuilder implements QueryStatementBuilder {
  constructor(
    private left: QueryStatement,
    private right: QueryStatement,
  ) {
    //super();
  }

  unionAll(query: QueryStatement) {
    return new UnionAllBuilder(
      this.createStatement(),
      query,
    );
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
