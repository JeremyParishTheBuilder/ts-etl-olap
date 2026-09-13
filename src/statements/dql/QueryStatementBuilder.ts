import type { StatementBuilder } from "../Statement.js";
import type { QueryStatement } from "./QueryStatement.js";
//import { UnionAllBuilder } from "./UnionAllStatement.js";

export /*abstrct class*/interface QueryStatementBuilder extends StatementBuilder {
  // constructor() {}

  // unionAll(query: QueryStatement) {
  //   return new UnionAllBuilder(
  //     this.createStatement(),
  //     query,
  //   );
  // }

  unionAll(query: QueryStatement): QueryStatementBuilder;

  // union(query: QueryStatement): QueryBuilder;
  // intersect(query: QueryStatement): QueryBuilder;
  // except(query: QueryStatement): QueryBuilder;

  // abstract getNextCalls(): {
  //   required: string[];
  //   optional: string[];
  // };

  // abstract createStatement(): QueryStatement;
}