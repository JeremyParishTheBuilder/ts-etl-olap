import { EngineContext } from "./EngineContext.js";
import {
  CONSTRAINT_KIND,
  type ConstraintSpec,
  type ForeignKey,
  type Unique,
} from "../types/Constraint.js";

export class Validator {
  constructor(private ctx: EngineContext) {}

  createDatabase(name: string) {
    if (this.ctx.resolver.getDatabase(false, name)) {
      throw new Error(`Database '${name}' already exists`);
    }
  }

  createTable(name: string) {
    if (this.ctx.resolver.getTable(false, name)) {
      throw new Error(`Table '${name}' already exists`);
    }
  }

  addConstraint(
    table: string,
    spec: ConstraintSpec
  ) {
    if (spec.kind === CONSTRAINT_KIND.foreignKey) {
      this.addForeignKey(
        table,
        spec
      );
    }
  }

  addForeignKey(
    childTableName: string,
    foreignKeySpec: ForeignKey
  ) {
    const childColumns = foreignKeySpec.columns;
    const parentTableName = foreignKeySpec.parentTable;
    const parentColumns = foreignKeySpec.parentColumns;

    if (childColumns.length === 0 || parentColumns.length === 0) {
      throw new Error("Foreign key columns required");
    }
  
    if (childColumns.length !== parentColumns.length) {
      throw new Error("Foreign key column count mismatch");
    }
  
    const parentTable = this.ctx.resolver.requireTable(false, parentTableName);
    const parentPK: Unique = parentTable.requirePrimaryKeyUnique();

    if (parentColumns.length !== parentPK.columns.length) {
      throw new Error("Foreign key must reference full primary key");
    }
    
    const childTable = this.ctx.resolver.resolveTable(false, childTableName);
    for(let i = 0; i < childColumns.length; ++i) {
      const childCol = childTable.requireColumn(childColumns[i]);
      const parentCol = parentTable.requireColumn(parentColumns[i]);
  
      if (childCol.type !== parentCol.type) {
        throw new Error(`Child Column type and parent column type mismatch`);
      }
  
      // Nullability rule is dialect-dependent
      const allowNullable = this.ctx.rules.constraints.allowNullableForeignKeys;
      if (!allowNullable && childCol.nullable) {
        throw new Error("Foreign key columns cannot be nullable");
      }
    }
  
    const indexKeys = childTable.indexOnColumns(childColumns);
    // create index keys, includes null values in case used for PK (where detecting null outside should throw)
    indexKeys.forEach((indexKey: string | null) => {
      if (indexKey === null) { return; } // all nulls are considered unique
      if (!parentPK.index.has(indexKey)) {
        throw new Error(`Some Child index key ${indexKey} not in parent table`);
      }
    });
  
    //note to self: ever need to get default value?

  }
}