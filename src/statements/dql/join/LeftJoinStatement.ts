import type { PredicateNode } from "../../../ast/predicate/PredicateNode.js";
import type { RelationSource } from "../../../semantic/relation/RelationSource.js";

export interface LeftJoinStatement {
  kind: "leftJoin";
  left: RelationSource;
  right: RelationSource;
  on: PredicateNode;
}
