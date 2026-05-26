import { type SemanticAnalyzer } from "./SemanticAnalyzer.js";
import { type CreateTableStatement } from "../statements/index.js";

import { type Action } from "../actions/Action.js";
import { CreateTableAction } from "../actions/CreateTableAction.js";
import { AddColumnAction } from "../actions/AddColumnAction.js";
import { type ColumnSpec, type InlineColumnSpec } from "../schema/Column.js";
import { type ConstraintSpec } from "../schema/Constraint.js";
import { AddForeignKeyAction } from "../actions/AddForeignKeyAction.js";
import { AddPrimaryKeyAction } from "../actions/AddPrimaryKeyAction.js";
import { AddCheckAction } from "../actions/AddCheckAction.js";
import { AddIndexAction } from "../actions/AddIndexAction.js";
import { CONSTRAINT_KIND } from "../schema/ConstraintKind.js";

export function bindCreateTable(
  semantic: SemanticAnalyzer,
  stmt: CreateTableStatement
) {
  const ctx = semantic.ctx;
  const stmtActions: Action[] = [];

  const dbName = ctx.requireDatabase().name;

  const tableName: string = stmt.table;

  // create table
  //validate
  if(semantic.ctx.getTable(tableName)) {
    throw new Error(`Table '${tableName}' already exists`);
  }

  //save action
  stmtActions.push(new CreateTableAction(dbName, tableName));

  // add columns and inline constraints 
  const seen = new Set<string>();
  for (const [colName, inlineColSpec] of Object.entries(stmt.columnSchema)) {
    //check for duplicate columns
    if (seen.has(colName)) {
      throw new Error(`Duplicate column '${colName}' in CREATE TABLE`);
    }
    seen.add(colName);

    const columnSpec: ColumnSpec = {name: colName, ...inlineColSpec};

    stmtActions.push(new AddColumnAction(dbName, tableName, columnSpec));

    //get any inline constraints
    const allInlineConstraints = constraintSpecsFromColumnSpec(colName, inlineColSpec);
    for (const spec of allInlineConstraints) {
      //let action: Action | undefined = undefined;

      switch (spec.kind) {
        case CONSTRAINT_KIND.foreignKey:
          // optionally skip FK if dialect disallows inline FKs
          if (!semantic.ctx.rules.ddl.supportsInlineForeignKeys) break; // TODO, need error here?

          stmtActions.push(
              new AddForeignKeyAction(
              dbName,
              tableName,
              {
                ...spec,
                onDelete: spec.onDelete ?? ctx.rules.constraints.foreignKeyDefaultOnDelete,
                onUpdate: spec.onDelete ?? ctx.rules.constraints.foreignKeyDefaultOnUpdate,
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
                nullsDistinct: ctx.rules.constraints.nullsDistinct
              }
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
                nullsDistinct: ctx.rules.constraints.nullsDistinct
              }
            )
          );

          stmtActions.push(
            new AddPrimaryKeyAction(
              dbName,
              tableName,
              spec,
            )
          );

          break;

        default:
          break;
      }

      // if (!action) {
      //   throw new Error(`Invalid Inline Constraint Spec`);
      // }
      //
      // stmtActions.push(action);
    }
  }

  // add constraints
  for (const spec of Object.values(stmt.constraintSchema ?? {})) {
    switch (spec.kind) {
      case CONSTRAINT_KIND.foreignKey:
        stmtActions.push(
          new AddForeignKeyAction(
            dbName,
            tableName,
            {
              ...spec,
              onDelete: spec.onDelete ?? ctx.rules.constraints.foreignKeyDefaultOnDelete,
              onUpdate: spec.onDelete ?? ctx.rules.constraints.foreignKeyDefaultOnUpdate,
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

      default:
        throw new Error(`Invalid Inline Constraint Spec`);
    }

  }

  return stmtActions;
}

function constraintSpecsFromColumnSpec(
  colName: string,
  colSpec: InlineColumnSpec,
  //ctx: ExecutionContext,
): ConstraintSpec[] {
  const specs: ConstraintSpec[] = [];

  if (colSpec.primaryKey) {
    specs.push({
      kind: CONSTRAINT_KIND.primaryKey,
      name: `${colName}_pk`,
      columns: [colName],
      index: `${colName}_i`,
    });
  }

  if (colSpec.unique) {
    specs.push({
      kind: CONSTRAINT_KIND.unique,
      name: `${colName}_uniq`,
      columns: [colName],
    });
  }

  if (colSpec.references) {
    specs.push({
      kind: CONSTRAINT_KIND.foreignKey,
      name: `${colName}_fk`,
      columns: [colName],
      parentTable: colSpec.references.table,
      parentColumns: [colSpec.references.column],
    });
  }

  if (colSpec.check) {
    specs.push({
      kind: CONSTRAINT_KIND.check,
      name: `${colName}_chk`,
      columns: [colName],
      expression: undefined,//colSpec.check,
    });
  }

  return specs;
}