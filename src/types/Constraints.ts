// export type PrimaryKey = { name: string };
// export type ForeignKey = { columns: string[]; parentTable: string; parentColumns: string[] };
// export type Unique = { columns: string[]; index: Set<string> };
// export type Check = { columns: string[]; expr: any/*Expression*/ };

// export type Constraint = PrimaryKey | Unique | ForeignKey | Check;

// export type ConstraintSpec =
//   | { kind: CONSTRAINT_KIND.primaryKey; name: string; constraint: { columns: string[] } }
//   | { kind: CONSTRAINT_KIND.unique; name: string; constraint: { columns: string[] } }
//   | { kind: CONSTRAINT_KIND.foreignKey; name: string; constraint: ForeignKey }
//   | { kind: CONSTRAINT_KIND.check; name: string; constraint: Check };


// Runtime Constraint objects
// export type PrimaryKey = { kind: CONSTRAINT_KIND.primaryKey; name: string };
// export type Unique = { kind: CONSTRAINT_KIND.unique; name: string; columns: string[]; index: Set<string> };
// export type ForeignKey = { kind: CONSTRAINT_KIND.foreignKey; name: string; columns: string[]; parentTable: string; parentColumns: string[] };
// export type Check = { kind: CONSTRAINT_KIND.check; name: string; columns: string[]; expr: any /*Expression*/ };

import {
  Constraint,
  ConstraintSpec,
  CONSTRAINT_KIND,
  PrimaryKey,
  ForeignKey,
  Unique,
  Check,
} from "./Constraint.js";

export class Constraints {
  primaryKey?: PrimaryKey;
  uniques: Map<string, Unique> = new Map();
  foreignKeys: Map<string, ForeignKey> = new Map();
  checks: Map<string, Check> = new Map();

  /**
   * Invariant:
   * - Primary keys are backed by a UNIQUE constraint with the same name
   * - Constraint names are enforced via the UNIQUE namespace
   */

  hasConstraint(name: string): boolean {
    if (this.primaryKey?.name === name) return true;
    if (this.uniques.has(name)) return true;
    if (this.foreignKeys.has(name)) return true;
    if (this.checks.has(name)) return true;
    return false;
  }

  getByName(name: string): Constraint | undefined {
    return this.uniques.get(name) ?? this.foreignKeys.get(name) ?? this.checks.get(name);
  }

  requireByName(name: string): Constraint {
    const constraint = this.getByName(name);
    if (!constraint) {
      throw new Error(`Constraint ${name} does not exist`);
    }
    return constraint;
  }

  requireNameAvailable(name: string) {
    if (this.hasConstraint(name)) {
      throw new Error(`Constraint ${name} already exists`);
    }
  }

  public getPrimaryKey(): PrimaryKey | undefined {
    return this.primaryKey;
  }

  public requirePrimaryKey(): PrimaryKey {
    const pk = this.getPrimaryKey();
    if (!pk) {
      throw new Error("Primary key does not exist");
    }
    return pk;
  }

  addPrimaryKey(spec: ConstraintSpec, columnIndices: number[]) {
    if (spec.kind !== CONSTRAINT_KIND.primaryKey) {
      throw new Error(`addPrimaryKey called with a non-pk constraint spec`);
    }

    if (this.primaryKey) {
      throw new Error(`Primary Key ${this.primaryKey.name} already exists`);
    }

    const uniqueSpec: ConstraintSpec = { ...spec, kind: CONSTRAINT_KIND.unique };
    this.addUnique(uniqueSpec, columnIndices);
    this.primaryKey = this.uniques.get(spec.name)! as PrimaryKey;
  }

  addUnique(spec: ConstraintSpec, columnIndices: number[]) {
    if (spec.kind !== CONSTRAINT_KIND.unique) {
      throw new Error(`addUnique called with a non-unique constraint spec`);
    }

    this.requireNameAvailable(spec.name);

    const unique: Unique = {
      ...spec,
      index: new Set<string>(),
      columnIndices: columnIndices,
    };

    this.uniques.set(spec.name, unique);
  }

  addForeignKey(spec: ConstraintSpec) {
    if (spec.kind !== CONSTRAINT_KIND.foreignKey) {
      throw new Error(`addForeignKey called with a non-unique constraint spec`);
    }

    this.requireNameAvailable(spec.name);

    this.foreignKeys.set(spec.name, spec);
  }

  addCheck(spec: ConstraintSpec) {
    if (spec.kind !== CONSTRAINT_KIND.check) {
      throw new Error(`addCheck called with a non-unique constraint spec`);
    }

    this.requireNameAvailable(spec.name);

    this.checks.set(spec.name, spec);
  }

  dropByName(name: string): void {
    this.requireByName(name);

    if (this.primaryKey?.name === name) {
      this.primaryKey = undefined;
      this.uniques.delete(name); // also delete the PK’s unique
    } else if (this.uniques.has(name)) {
      this.uniques.delete(name);
    } else if (this.foreignKeys.has(name)) {
      this.foreignKeys.delete(name);
    } else if (this.checks.has(name)) {
      this.checks.delete(name);
    }
  }

  getConstraintsReferencingColumn(column: string): Constraint[] {
    const result: Constraint[] = [];

    for (const [key, value] of this.uniques.entries()) {
      if (value.columns.includes(column)) result.push(value);
    }

    for (const [key, value] of this.foreignKeys.entries()) {
      if (value.columns.includes(column)) result.push(value);
    }

    for (const [key, value] of this.checks.entries()) {
      if (value.columns.includes(column)) result.push(value);
    }

    return result;
  }

  renameColumn(oldName: string, newName: string) {
    // Update uniques
    for (const unique of this.uniques.values()) {
      unique.columns = unique.columns.map(c => (c === oldName ? newName : c));
    }

    // Update foreign keys
    for (const fk of this.foreignKeys.values()) {
      fk.columns = fk.columns.map(c => (c === oldName ? newName : c));
    }

    // Update checks
    for (const check of this.checks.values()) {
      check.columns = check.columns.map(c => (c === oldName ? newName : c));
    }

    // Primary key columns are stored only in the corresponding unique, so nothing else needed
  }
}