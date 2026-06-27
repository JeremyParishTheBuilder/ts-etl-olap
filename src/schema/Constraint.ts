import { CONSTRAINT_KIND } from "./ConstraintKind.js";
import { ReferentialAction } from "./ReferentialAction.js";
import { type PredicateNode } from "../evaluation/predicate/Predicate.js";

export type PrimaryKeySpec = {
  kind: CONSTRAINT_KIND.primaryKey,
  name: string,
  columns: string[],
}

export type UniqueSpec = {
  kind: CONSTRAINT_KIND.unique,
  name: string,
  columns: string[]
}
    
export type ForeignKeySpec = {
  kind: CONSTRAINT_KIND.foreignKey,
  name: string,
  columns: string[],
  parentTable: string,
  parentColumns: string[],
  onDelete?: ReferentialAction,
  onUpdate?: ReferentialAction,
}

export type CheckSpec = {
  kind: CONSTRAINT_KIND.check,
  name: string,
  //columns: string[],
  predicate: PredicateNode,
}

export type ConstraintSpec =
  | PrimaryKeySpec
  | UniqueSpec
  | ForeignKeySpec
  | CheckSpec

export type DropConstraintSpec =
  | { name: string }
  | { kind: CONSTRAINT_KIND.primaryKey };

