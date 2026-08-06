import { type SemanticAnalyzer } from "./SemanticAnalyzer.js";
import { type CreateTableStatement } from "../statements/index.js";

import { type Action } from "../actions/Action.js";
import { CreateTableAction } from "../actions/CreateTableAction.js";
import { AddColumnAction } from "../actions/AddColumnAction.js";
import {
  type ColumnSpec,
  type InlineColumnSpec,
} from "../relational/Column.js";
import { type ConstraintSpec } from "../relational/Constraint.js";
import { AddForeignKeyAction } from "../actions/AddForeignKeyAction.js";
import { AddPrimaryKeyAction } from "../actions/AddPrimaryKeyAction.js";
import { AddCheckAction } from "../actions/AddCheckAction.js";
import { AddIndexAction } from "../actions/AddIndexAction.js";
import { CONSTRAINT_KIND } from "../relational/ConstraintKind.js";
import { PrimaryKey } from "../relational/PrimaryKey.js";
import { ForeignKey } from "../relational/ForeignKey.js";
import { AddUniqueConstraintAction } from "../actions/AddUniqueConstraintAction.js";

export function bindCreateTable(
  semantic: SemanticAnalyzer,
  stmt: CreateTableStatement,
) {
  const ctx = semantic.ctx;
  const stmtActions: Action[] = [];

  const dbName = ctx.requireDatabase().name;

  const tableName: string = stmt.table;

  // create table
  //validate
  if (semantic.ctx.getTable(tableName)) {
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

    const columnSpec: ColumnSpec = { name: colName, ...inlineColSpec };

    stmtActions.push(
      new AddColumnAction(dbName, tableName, {
        //id: ctx.ids.nextColumnId(),
        ...columnSpec,
      }),
    );

    //get any inline constraints
    const allInlineConstraints = constraintSpecsFromColumnSpec(
      colName,
      inlineColSpec,
    );
    for (const spec of allInlineConstraints) {
      //let action: Action | undefined = undefined;

      switch (spec.kind) {
        case CONSTRAINT_KIND.foreignKey: {
          // optionally skip FK if dialect disallows inline FKs
          if (!semantic.ctx.rules.ddl.supportsInlineForeignKeys) break; // TODO, need error here?

          const reverseIndexName = ForeignKey.defaultIndexName(spec.name);

          stmtActions.push(
            new AddIndexAction(dbName, tableName, {
              name: reverseIndexName,
              columns: spec.columns,
              unique: false,
              nullsDistinct: ctx.rules.constraints.nullsDistinct,
            }),
          );

          stmtActions.push(
            new AddForeignKeyAction(dbName, tableName, {
              ...spec,
              onDelete:
                spec.onDelete ??
                ctx.rules.constraints.foreignKeyDefaultOnDelete,
              onUpdate:
                spec.onDelete ??
                ctx.rules.constraints.foreignKeyDefaultOnUpdate,
              reverseIndex: reverseIndexName,
            }),
          );

          break;
        }

        case CONSTRAINT_KIND.unique:
          if ((spec.columns === undefined) === (spec.using === undefined)) {
            throw new Error(
              "UNIQUE constraint requires exactly one of 'columns' or 'using'.",
            );
          }

          stmtActions.push(
            new AddUniqueConstraintAction(dbName, tableName, {
              name: spec.name,
              columns: spec.columns,
              using: spec.using,
              nullsDistinct: ctx.rules.constraints.nullsDistinct,
            }),
          );

          break;

        case CONSTRAINT_KIND.check:
          stmtActions.push(new AddCheckAction(dbName, tableName, spec));

          break;

        case CONSTRAINT_KIND.primaryKey:
          stmtActions.push(
            new AddIndexAction(dbName, tableName, {
              name: PrimaryKey.defaultIndexName(spec.name),
              columns: spec.columns,
              unique: true,
              nullsDistinct: ctx.rules.constraints.nullsDistinct,
            }),
          );

          stmtActions.push(new AddPrimaryKeyAction(dbName, tableName, spec));

          break;

        default:
          break;
      }
    }
  }

  // add constraints
  for (const spec of Object.values(stmt.constraintSchema ?? {})) {
    switch (spec.kind) {
      case CONSTRAINT_KIND.foreignKey: {
        const reverseIndexName = ForeignKey.defaultIndexName(spec.name);

        stmtActions.push(
          new AddIndexAction(dbName, tableName, {
            name: reverseIndexName,
            columns: spec.columns,
            unique: false,
            nullsDistinct: ctx.rules.constraints.nullsDistinct,
          }),
        );

        stmtActions.push(
          new AddForeignKeyAction(dbName, tableName, {
            ...spec,
            onDelete:
              spec.onDelete ?? ctx.rules.constraints.foreignKeyDefaultOnDelete,
            onUpdate:
              spec.onDelete ?? ctx.rules.constraints.foreignKeyDefaultOnUpdate,
            reverseIndex: reverseIndexName,
          }),
        );

        break;
      }

      case CONSTRAINT_KIND.unique:
        if ((spec.columns === undefined) === (spec.using === undefined)) {
          throw new Error(
            "UNIQUE constraint requires exactly one of 'columns' or 'using'.",
          );
        }

        stmtActions.push(
          new AddUniqueConstraintAction(dbName, tableName, {
            name: spec.name,
            columns: spec.columns,
            using: spec.using,
            nullsDistinct: ctx.rules.constraints.nullsDistinct,
          }),
        );

        break;

      case CONSTRAINT_KIND.check:
        stmtActions.push(new AddCheckAction(dbName, tableName, spec));

        break;

      case CONSTRAINT_KIND.primaryKey:
        stmtActions.push(
          new AddIndexAction(dbName, tableName, {
            name: PrimaryKey.defaultIndexName(spec.name),
            columns: spec.columns,
            unique: true,
            nullsDistinct: ctx.rules.constraints.nullsDistinct,
          }),
        );

        stmtActions.push(new AddPrimaryKeyAction(dbName, tableName, spec));

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
): ConstraintSpec[] {
  const specs: ConstraintSpec[] = [];

  if (colSpec.primaryKey) {
    specs.push({
      kind: CONSTRAINT_KIND.primaryKey,
      name: `${colName}_pk`,
      columns: [colName],
      //index: `${colName}_i`,
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
      predicate: colSpec.check,
    });
  }

  return specs;
}
