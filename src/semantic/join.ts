import { InnerJoinNode } from "../evaluation/plan/join/InnerJoinNode.js";
import type { PlanNode } from "../evaluation/plan/PlanNode.js";
import type { QueryPlan } from "../evaluation/plan/QueryPlan.js";
import type { Predicate } from "../evaluation/predicate/Predicate.js";
import type { RowView } from "../relational/RowView.js";
import type { JoinStatement } from "../statements/dql/join/JoinStatement.js";
import { bindPredicate, resolvePredicate } from "./predicate.js";
import { bindRelationSource } from "./relation/bindRelationSource.js";
import type { BoundRelation } from "./relation/BoundRelation.js";
import { RelationScope } from "./relation/RelationScope.js";
import type { SemanticAnalyzer } from "./SemanticAnalyzer.js";

export function bindJoin(
  semantic: SemanticAnalyzer,
  join: JoinStatement,
): BoundRelation {
  const left = bindRelationSource(semantic, join.left);

  const right = bindRelationSource(semantic, join.right);

  const scope = new RelationScope([...left.relations, ...right.relations]);

  const predicate = bindPredicate(resolvePredicate(join.on, scope), scope);

  const plan: QueryPlan = {
    root: createJoinRoot(join.kind, left, right, predicate),
    columns: [...left.plan.columns, ...right.plan.columns],
  };

  return {
    plan,
    relations: [...left.relations, ...right.relations],
  };
}

function createJoinRoot(
  kind: JoinStatement["kind"],
  left: BoundRelation,
  right: BoundRelation,
  predicate: Predicate<RowView>,
): PlanNode {
  switch (kind) {
    case "innerJoin":
      return new InnerJoinNode(left.plan.root, right.plan.root, predicate);

    // case "leftJoin":
    //   return new LeftJoinNode(
    //     left.plan.root,
    //     right.plan.root,
    //     predicate,
    //   );

    // case "rightJoin":
    //   return new RightJoinNode(
    //     left.plan.root,
    //     right.plan.root,
    //     predicate,
    //   );

    // case "fullJoin":
    //   return new FullJoinNode(
    //     left.plan.root,
    //     right.plan.root,
    //     predicate,
    //   );

    default:
      //return assertNever(kind);
      throw new Error(`Invalid Join Kind: ${kind}.`);
  }
}

// TODO, switch to assert never after adding the remaining join types
// function assertNever(value: never): never {
//   throw new Error(`Unsupported join kind: ${value}`);
// }
