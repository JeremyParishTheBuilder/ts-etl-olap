import { type Action } from "../actions/Action.js";
import { AddCheckAction } from "../actions/AddCheckAction.js";
import { AddColumnAction } from "../actions/AddColumnAction.js";
import { AddForeignKeyAction } from "../actions/AddForeignKeyAction.js";
import { AddPrimaryKeyAction } from "../actions/AddPrimaryKeyAction.js";
import { DropForeignKeyAction } from "../actions/DropForeignKeyAction.js";


import { type AlterTableStatement } from "../statements/index.js";
import { type ColumnSpec } from "../schema/Column.js";
import { CONSTRAINT_KIND } from "../schema/Constraint.js";
import { PrimaryKey } from "../schema/PrimaryKey.js";
import { Index } from "../schema/Index.js";
import { ForeignKey } from "../schema/ForeignKey.js";
import { Check } from "../schema/Check.js";
import { type SemanticAnalyzer } from "./SemanticAnalyzer.js";
import { DropPrimaryKeyAction } from "../actions/DropPrimaryKeyAction.js";
import { DropCheckAction } from "../actions/DropCheckAction.js";
import { DropIndexAction } from "../actions/DropIndexAction.js";
import { AddIndexAction } from "../actions/AddIndexAction.js";

export function bindAlterTable(
  semantic: SemanticAnalyzer,
  stmt: AlterTableStatement
) {
  const ctx = semantic.ctx;
  const stmtActions: Action[] = [];

  const dbName = ctx.requireDatabase().name;
  const table = ctx.requireTable(stmt.table);
  const tableName = stmt.table;
  

  if (stmt.op === "add_constraint") {
    const spec = stmt.constraint;

    const childColumns = table.requireColumns(spec.columns);

    switch (spec.kind) {
      case CONSTRAINT_KIND.foreignKey:

        const parentTable = ctx.requireTable(spec.parentTable);
        const parentColumns = parentTable.requireColumns(spec.parentColumns);

        if (!ctx.rules.constraints.allowNullableForeignKeys) {
          for (const col of childColumns) {
            if (col.nullable) {
              throw new Error(
                `Foreign key column '${col.name}' cannot be nullable`
              )
            }
          }
        }

        stmtActions.push(
          new AddForeignKeyAction(
            dbName,
            tableName,
            spec,
          )
        );

        break;

      case CONSTRAINT_KIND.primaryKey:
        const indexName = spec.index ?? spec.name;

        stmtActions.push(
          new AddIndexAction(
            dbName,
            tableName,
            {
              name: indexName,
              columns: spec.columns,
              unique: true,
              nullsDistinct: ctx.rules.constraints.nullsDistinct,
            },
          )
        );

        stmtActions.push(
          new AddPrimaryKeyAction(
            dbName,
            tableName,
            {
              ...spec,
              index: indexName
            },
          )
        );
      
        break;

      case CONSTRAINT_KIND.unique:
        stmtActions.push(
          new AddIndexAction(
            dbName,
            tableName,
            {
              ...spec,
              unique: true,
              nullsDistinct: ctx.rules.constraints.nullsDistinct,
            },
          )
        );
      
        break;

      case CONSTRAINT_KIND.check:
        stmtActions.push(
          new AddCheckAction(
            dbName,
            tableName,
            spec,
          )
        );
        
        break;

    }
  } else if (stmt.op === "drop_constraint") {
    const constraintName = stmt.constraintName;

    const constraint = table.requireConstraintByName(constraintName);

    if (constraint instanceof PrimaryKey) {
      stmtActions.push(
        new DropPrimaryKeyAction(
          dbName,
          tableName,
        )
      );
    } else if (constraint instanceof Index) {
      stmtActions.push(
        new DropIndexAction(
          dbName,
          tableName,
          constraintName,
        )
      );
    } else if (constraint instanceof ForeignKey) {
      stmtActions.push(
        new DropForeignKeyAction(
          dbName,
          tableName,
          constraintName,
        )
      );
    } else if (constraint instanceof Check) {
      stmtActions.push(
        new DropCheckAction(
          dbName,
          tableName,
          constraintName,
        )
      );
    } else {
      throw new Error(`Invalid Constraint detected: ${constraint.name}`);
    }
  } else if (stmt.op === "drop_primary_key") {
    stmtActions.push(
      new DropPrimaryKeyAction(
        dbName,
        tableName,
      )
    );
  } else if (stmt.op === "add_column") {
    stmtActions.push(
      new AddColumnAction(
        dbName,
        tableName,
        { name: stmt.columnName, ...stmt.inlineColumnSpec } as ColumnSpec,
      )
    );
  }

  //TODO, add the remaining ops (rename column, drop column, etc.)

  return stmtActions;
}