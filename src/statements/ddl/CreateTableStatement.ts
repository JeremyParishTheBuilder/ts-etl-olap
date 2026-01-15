import { Statement } from "../Statement.js";
import { CreateTableAction } from "../../actions/CreateTableAction.js";
import { AddColumnAction } from "../../actions/AddColumnAction.js";
import { AddConstraintAction } from "../../actions/AddConstraintAction.js";
import type { Column, InlineColumnSpec } from "../../types/Column.js";
import { CONSTRAINT_KIND, type ConstraintSpec } from "../../types/Constraint.js";

export class CreateTableStatement extends Statement<void> {
  constructor(
    table: string,
    columnSchema: Record<string, InlineColumnSpec>,
    constraintSchema?: Record<string, ConstraintSpec>
  ) {
    super();

    // create table
    this.addAction(new CreateTableAction(table));

    // add columns and inline constraints 
    for (const [colName, colSpec] of Object.entries(columnSchema)) {
      const column: Column = { name: colName, ...colSpec };

      this.addAction(new AddColumnAction(table, column));

      const pkConstraint = constraintSpecFromColumnSpec(colName, colSpec, CONSTRAINT_KIND.primaryKey);
      if (pkConstraint) this.addAction(new AddConstraintAction(table, pkConstraint, true));

      const uniqueConstraint = constraintSpecFromColumnSpec(colName, colSpec, CONSTRAINT_KIND.unique);
      if (uniqueConstraint) this.addAction(new AddConstraintAction(table, uniqueConstraint, true));

      const fkConstraint = constraintSpecFromColumnSpec(colName, colSpec, CONSTRAINT_KIND.foreignKey);
      if (fkConstraint) this.addAction(new AddConstraintAction(table, fkConstraint, true));
    }

    // add constraints
    for (const [name, spec] of Object.entries(constraintSchema ?? {})) {
      this.addAction(new AddConstraintAction(table, spec));
    }
  }
}

function constraintSpecFromColumnSpec(
  colName: string,
  colSpec: InlineColumnSpec,
  kind: CONSTRAINT_KIND
): ConstraintSpec | null {
  switch (kind) {
    case CONSTRAINT_KIND.primaryKey:
      if (!colSpec.primaryKey) return null;
      return {
        kind: CONSTRAINT_KIND.primaryKey,
        name: colName && "_" && CONSTRAINT_KIND.primaryKey,
        columns: [colName],
      };

    case CONSTRAINT_KIND.unique:
      if (!colSpec.unique) return null;
      return {
        kind: CONSTRAINT_KIND.unique,
        name: colName && "_" && CONSTRAINT_KIND.unique,
        columns: [colName],
      };

    case CONSTRAINT_KIND.foreignKey:
      if (!colSpec.references) return null;
      return {
        kind: CONSTRAINT_KIND.foreignKey,
        name: colName && "_" && CONSTRAINT_KIND.foreignKey,
        columns: [colName],
        parentTable: colSpec.references.table,
        parentColumns: [colSpec.references.column],
      };

    case CONSTRAINT_KIND.check:
      if (!colSpec.references) return null;
      return {
        kind: CONSTRAINT_KIND.check,
        name: colName && "_" && CONSTRAINT_KIND.check,
        columns: [colName],
        expr: ""/*Expression*/,
      };

    default:
      return null;
  }
}