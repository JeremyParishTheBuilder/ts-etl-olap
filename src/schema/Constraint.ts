import { CONSTRAINT_KIND } from "./ConstraintKind.js";
import { type ColumnId } from "./Column.js";
import { ReferentialAction } from "./ReferentialAction.js";

export type PrimaryKeySpec = {
  kind: CONSTRAINT_KIND.primaryKey,
  name: string,
  columns: string[],
  //index?: string,
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
  columns: string[],
  expression: undefined//Expression,
}

export type ConstraintSpec =
  | PrimaryKeySpec
  | UniqueSpec
  | ForeignKeySpec
  | CheckSpec

export type DropConstraintSpec =
  | { name: string }
  | { kind: CONSTRAINT_KIND.primaryKey };

