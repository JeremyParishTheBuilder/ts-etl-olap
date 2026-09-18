import { type QueryPlan } from "../evaluation/plan/QueryPlan.js";
import { UnionAllNode } from "../evaluation/plan/UnionAllNode.js";
import type { QueryStatement } from "../statements/dql/QueryStatement.js";
import type { UnionAllStatement } from "../statements/dql/UnionAllStatement.js";
import { reconcileQueryColumns } from "./reconcileQueryColumns.js";
import { bindSelect } from "./select.js";
import type { SemanticAnalyzer } from "./SemanticAnalyzer.js";

export function bindQuery(
  semantic: SemanticAnalyzer,
  query: QueryStatement,
): QueryPlan {
  switch (query.kind) {
    case "select":
      return bindSelect(semantic, query);

    case "unionAll":
      return bindUnionAll(semantic, query);
  }
}

function bindUnionAll(
  semantic: SemanticAnalyzer,
  stmt: UnionAllStatement,
): QueryPlan {
  const left = bindQuery(semantic, stmt.left);
  const right = bindQuery(semantic, stmt.right);

  const columns = reconcileQueryColumns(left.columns, right.columns);

  return {
    root: new UnionAllNode(left.root, right.root),
    columns,
  };
}
