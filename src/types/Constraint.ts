export enum CONSTRAINT_KIND {
  primaryKey = "PRIMARY KEY",
  foreignKey = "FOREIGN KEY",
  unique = "UNIQUE",
  check = "CHECK"
}

export interface BaseConstraint {
  name: string;
};

export interface Unique extends BaseConstraint {
  columns: string[];
  index: Set<string>;
  columnIndices: number[];
};

export type PrimaryKey = Unique & {
  isPrimaryKey: true;
};

export interface ForeignKey extends BaseConstraint {
  columns: string[];
  parentTable: string;
  parentColumns: string[]
};

export interface Check extends BaseConstraint {
  columns: string[];
  expr: any/*Expression*/;
};

export type Constraint = PrimaryKey | Unique | ForeignKey | Check;

// Declarative input (ConstraintSpec)
export type ConstraintSpec =
  | { kind: CONSTRAINT_KIND.primaryKey; } & Omit<PrimaryKey, "isPrimaryKey" | "index" | "columnIndices">
  | { kind: CONSTRAINT_KIND.unique; } & Omit<Unique, "index" | "columnIndices">
  | { kind: CONSTRAINT_KIND.foreignKey; } & ForeignKey
  | { kind: CONSTRAINT_KIND.check; } & Check


export type DropConstraintSpec =
  | { name: string }
  | { kind: CONSTRAINT_KIND.primaryKey };