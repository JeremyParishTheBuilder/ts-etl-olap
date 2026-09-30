import type { PredicateNode } from "../../../ast/predicate/PredicateNode.js";
import type { RelationSource } from "../../../semantic/relation/RelationSource.js";

export interface RightJoinStatement {
  kind: "rightJoin";
  left: RelationSource;
  right: RelationSource;
  on: PredicateNode;
}
