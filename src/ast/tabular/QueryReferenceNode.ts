import type { QueryStatement } from "../../statements/dql/QueryStatement.js";
import { TabularExpressionNode } from "./TabularExpressionNode.js";

export class QueryReferenceNode extends TabularExpressionNode {
  readonly kind = "query";

  constructor(public readonly query: QueryStatement) {
    super();
  }
}
