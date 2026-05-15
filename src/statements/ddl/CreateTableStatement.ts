import { type BaseStatement, type StatementBuilder } from "../Statement.js";
import { type InlineColumnSpec } from "../../schema/Column.js";
import { type ConstraintSpec } from "../../schema/Constraint.js";

export interface CreateTableStatement extends BaseStatement {
  kind: "create_table",
  table: string,
  columnSchema: Record<string, InlineColumnSpec>,
  constraintSchema: Record<string, ConstraintSpec>,
}

export class CreateTableBuilder implements StatementBuilder {
  constructor(
    private table: string,
    private columns: Record<string, InlineColumnSpec>,
    private constraints: Record<string, ConstraintSpec>,
  ) {}

  getNextCalls() {
    return {
      required: [],
      optional: [],
    };
  }

  createStatement(): CreateTableStatement {
    return {
      kind: "create_table",
      table: this.table,
      columnSchema: this.columns,
      constraintSchema: this.constraints
    };
  }
}