import { CONSTRAINT_KIND } from "./ConstraintKind.js";
import { type ColumnKeyType } from "./Column.js";
import { ReferentialAction } from "./ReferentialAction.js";

export type PrimaryKeySpec = {
  kind: CONSTRAINT_KIND.primaryKey,
  name: string,
  columns: ColumnKeyType[],
  index?: string,
}

export type UniqueSpec = {
  kind: CONSTRAINT_KIND.unique,
  name: string,
  columns: ColumnKeyType[]
}
    
export type ForeignKeySpec = {
  kind: CONSTRAINT_KIND.foreignKey,
  name: string,
  columns: ColumnKeyType[],
  parentTable: string,
  parentColumns: ColumnKeyType[],
  onDelete?: ReferentialAction,
  onUpdate?: ReferentialAction,
}

export type CheckSpec = {
  kind: CONSTRAINT_KIND.check,
  name: string,
  columns: ColumnKeyType[],
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

