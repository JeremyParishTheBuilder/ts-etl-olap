import { Action } from "../actions/Action.js";
import { CreateTableAction } from "../actions/CreateTableAction.js";
import { AddColumnAction } from "../actions/AddColumnAction.js";
import { AddConstraintAction } from "../actions/AddConstraintAction.js";
import { type Column, type InlineColumnSpec } from "../types/Column.js";
import { CONSTRAINT_KIND, type ConstraintSpec } from "../types/Constraint.js";
import { type CreateTableStatement } from "../statements/index.js";
import { Table } from "../types/Table.js";
import { type SemanticAnalyzer } from "./SemanticAnalyzer.js";

export function createTableHandler(
  semantic: SemanticAnalyzer,
  stmt: CreateTableStatement
) {
  const stmtActions: Action[] = [];

  const tableName: string = stmt.table;

  // create table
  //validate
  if(semantic.ctx.resolver.getTable(false, tableName)) {
    throw new Error(`Table '${tableName}' already exists`);
  }
  //save action
  stmtActions.push(new CreateTableAction(tableName));

  // add columns and inline constraints 
  const seen = new Set<string>();
  for (const [colName, colSpec] of Object.entries(stmt.columnSchema)) {
    //check for duplicate columns
    if (seen.has(colName)) {
      throw new Error(`Duplicate column '${colName}' in CREATE TABLE`);
    }
    seen.add(colName);

    const column: Column = { name: colName, ...colSpec };
    stmtActions.push(new AddColumnAction(tableName, column));

    //get any inline constraints
    const allInlineConstraints = constraintSpecsFromColumnSpec(colName, colSpec);
    for (const spec of allInlineConstraints) {
      // optionally skip FK if dialect disallows inline FKs
      if (spec.kind === CONSTRAINT_KIND.foreignKey && !semantic.ctx.rules.ddl.supportsInlineForeignKeys) continue;
      stmtActions.push(new AddConstraintAction(tableName, spec));
    }
  }

  // add constraints
  for (const spec of Object.values(stmt.constraintSchema ?? {})) {
    stmtActions.push(new AddConstraintAction(tableName, spec));
  }

  return stmtActions;
}

function constraintSpecsFromColumnSpec(
  colName: string,
  colSpec: InlineColumnSpec
): ConstraintSpec[] {
  const specs: ConstraintSpec[] = [];

  if (colSpec.primaryKey) {
    specs.push({
      kind: CONSTRAINT_KIND.primaryKey,
      name: `${colName}_pk`,
      columns: [colName],
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
      expr: colSpec.check,
      columns: [colName],
    });
  }

  return specs;
}