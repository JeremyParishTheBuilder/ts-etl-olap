export enum CONSTRAINT_KIND {
  primaryKey = "PRIMARY KEY",
  foreignKey = "FOREIGN KEY",
  unique = "UNIQUE",
  check = "CHECK"
}

import { type ColumnKeyType } from "./Column.js";

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

