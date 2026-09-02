import { type BaseStatement, type StatementBuilder } from "../Statement.js";
import { type InlineColumnSpec } from "../../relational/Column.js";
import { type ConstraintSpec } from "../../relational/Constraint.js";
import type { SelectStatement } from "../dql/SelectStatement.js";

export interface CreateTableStatement extends BaseStatement {
  kind: "create_table";
  table: string;

  columnSchema?: Record<string, InlineColumnSpec>;
  constraintSchema?: Record<string, ConstraintSpec>;

  select?: SelectStatement;
}

export class CreateTableBuilder implements StatementBuilder {
  private selectStatement?: SelectStatement;

  constructor(
    private table: string,
    private columns?: Record<string, InlineColumnSpec>,
    private constraints?: Record<string, ConstraintSpec>,
  ) {}

  as(query: SelectStatement) {
    this.selectStatement = query;
  }

  getNextCalls() {
    if (!this.selectStatement) {
      return {
        required: [],
        optional: ["as"],
      };
    }

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
      constraintSchema: this.constraints,
      select: this.selectStatement,
    };
  }
}
