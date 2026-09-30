import { queryColumnsFromTable } from "../../evaluation/plan/QueryPlan.js";
import { TableScanNode } from "../../evaluation/plan/TableScanNode.js";
import type {
  QueryReference,
  RelationSource,
  TableReference,
} from "./RelationSource.js";
import { bindQuery } from "../query.js";
import type { SemanticAnalyzer } from "../SemanticAnalyzer.js";
import type { BoundRelation } from "./BoundRelation.js";
import {
  relationColumnsFromQueryPlan,
  relationColumnsFromTable,
  type RelationColumn,
} from "./RelationColumn.js";
import { bindJoin } from "../join.js";
import { normalizeIdentifier } from "../../utils/normalizeIdentifier.js";

function bindTableReference(
  semantic: SemanticAnalyzer,
  source: TableReference,
): BoundRelation {
  const table = semantic.ctx.requireTable(source.name);

  return {
    plan: {
      root: new TableScanNode(table),
      columns: queryColumnsFromTable(table),
    },
    relations: [
      {
        name: source.alias ?? source.name,
        columns: relationColumnsFromTable(table),
      },
    ],
  };
}

function bindQueryReference(
  semantic: SemanticAnalyzer,
  source: QueryReference,
): BoundRelation {
  const plan = bindQuery(semantic, source.query);

  const columns = relationColumnsFromQueryPlan(plan);

  if (semantic.ctx.rules.dql.denyDuplicateDerivedTableColumnNames) {
    assertNoDuplicateColumnNames(columns);
  }

  return {
    plan,
    relations: [
      {
        name: source.alias,
        columns: columns,
      },
    ],
  };
}

function assertNoDuplicateColumnNames(columns: RelationColumn[]): void {
  const seen = new Set<string>();

  for (const col of columns) {
    const name = normalizeIdentifier(col.column.name);

    if (seen.has(name)) {
      throw new Error(`Duplicate column name '${col.column.name}'`);
    }

    seen.add(name);
  }
}

export function bindRelationSource(
  semantic: SemanticAnalyzer,
  source: RelationSource,
): BoundRelation {
  switch (source.kind) {
    case "table":
      return bindTableReference(semantic, source);

    case "query":
      return bindQueryReference(semantic, source);

    case "join":
      return bindJoin(semantic, source.join);

    default: {
      throw new Error(`Source unknown: ${source} `);
    }
  }
}
