import { type BaseStatement, type StatementBuilder } from "../Statement.js";
import { Column }  from "../../types/Column.js";
import { CONSTRAINT_KIND, type ConstraintSpec } from "../../types/Constraint.js";

export type AlterTableStatement =
  | AlterAddColumn
  | AlterDropColumn
  | AlterRenameColumn
  | AlterModifyColumn
  | AlterAddConstraint
  | AlterDropConstraint;

interface AlterTableBaseStatement extends BaseStatement {
  kind: "alter_table",
  table: string,
}

interface AlterAddColumn extends AlterTableBaseStatement {
  op: "add_column";
  column: Column;
}

interface AlterDropColumn extends AlterTableBaseStatement {
  op: "drop_column";
  columnName: string;
}

interface AlterRenameColumn extends AlterTableBaseStatement {
  op: "rename_column";
  from: string;
  to: string;
}

interface AlterModifyColumn extends AlterTableBaseStatement {
  op: "modify_column";
  columnName: string;
  column: Column;
}

interface AlterAddConstraint extends AlterTableBaseStatement {
  op: "add_constraint";
  constraint: ConstraintSpec;
}

interface AlterDropConstraint extends AlterTableBaseStatement {
  op: "drop_constraint";
  constraintName: string;
}

type AlterTableBuilderState =
  | { state: "init" }
  | { state: "add_column"; column: Column }
  | { state: "drop_column"; columnName: string }
  | { state: "rename_column"; from: string; to: string }
  | { state: "modify_column"; columnName: string; column: Column }
  | { state: "add_constraint"; partial: Partial<ConstraintSpec>, constraint?: ConstraintSpec }
  | { state: "drop_constraint"; constraintName: string };

export class AlterTableBuilder implements StatementBuilder {
  private state: AlterTableBuilderState = { state: "init" };

  constructor(private table: string) {}

  private assertState<S extends AlterTableBuilderState["state"]>(
    expected: S
  ): Extract<AlterTableBuilderState, { state: S }> {
    if (this.state.state !== expected) {
      throw new Error(
        `AlterTableBuilder in ${this.state.state} state, expected ${expected}`
      );
    }
    return this.state as Extract<AlterTableBuilderState, { state: S }>;
  }

  private transitionState(next: AlterTableBuilderState) {
    this.state = next;
  }
  
  addColumn(column: Column) {
    this.assertState("init");
    this.transitionState({ state: "add_column", column });
  }

  dropColumn(columnName: string) {
    this.assertState("init");
    this.transitionState({ state: "drop_column", columnName });
  }

  renameColumn(from: string, to: string) {
    this.assertState("init");
    this.transitionState({ state: "rename_column", from, to });
  }

  modifyColumn(columnName: string, column: Column) {
    this.assertState("init");
    this.transitionState({ state: "modify_column", columnName, column });
  }

  dropConstraint(constraintName: string) {
    this.assertState("init");
    this.transitionState({ state: "drop_constraint", constraintName });
  }

  addConstraint(constraintName: string) {
    this.assertState("init");
    this.transitionState({ state: "add_constraint", partial: { name: constraintName } });
  }

  primaryKey(columns: string[]) {
    this.state = this.assertState("add_constraint");

    const partial = this.state.partial;

    if (partial.kind) {
      throw new Error("Constraint kind already specified");
    }

    this.state.constraint = {
      ...partial,
      kind: CONSTRAINT_KIND.primaryKey,
      columns: columns
    } as ConstraintSpec;
  }

  unique(columns: string[]) {
    this.state = this.assertState("add_constraint");

    const partial = this.state.partial;

    if (partial.kind) {
      throw new Error("Constraint kind already specified");
    }

    this.state.constraint = {
      ...partial,
      kind: CONSTRAINT_KIND.unique,
      columns: columns
    } as ConstraintSpec;
  }

  check(columns: string[], expr: any/*Expression*/) {
    this.state = this.assertState("add_constraint");

    const partial = this.state.partial;

    if (partial.kind) {
      throw new Error("Constraint kind already specified");
    }

    this.state.constraint = {
      ...partial,
      kind: CONSTRAINT_KIND.check,
      columns: columns,
      expr: expr/*Expression*/
    } as ConstraintSpec;
  }

  foreignKey(childColumns: string[]) {
    this.state = this.assertState("add_constraint");

    const partial = this.state.partial;
    if (partial.kind) {
      throw new Error("Constraint kind already specified");
    }

    this.state.partial = {
      ...partial,
      kind: CONSTRAINT_KIND.foreignKey,
      columns: childColumns
    };
  }

  references(parentTable: string, parentColumns: string[]) {
    this.state = this.assertState("add_constraint");

    const partial = this.state.partial;

    if (!partial?.columns || !partial?.kind || !partial.name) {
      throw new Error("Incomplete foreign key definition");
    }

    if (partial.kind !== CONSTRAINT_KIND.foreignKey) {
      throw new Error(`References is only used for foreign keys, not ${partial.kind}`);
    }

    this.state.constraint = {
      ...partial,
      parentTable,
      parentColumns
    } as ConstraintSpec;
  }

  getNextCalls() {
    switch (this.state.state) {
      case "init":
        return {
          required: [
            "addColumn",
            "dropColumn",
            "renameColumn",
            "modifyColumn",
            "addConstraint",
            "dropConstraint"
          ],
          optional: []
        };

      case "add_constraint":
        if (!this.state.constraint) {
          if (!this.state.partial.kind) {
            return { required: ["primaryKey", "unique", "foreignKey", "check"], optional: [] };
          }
          if (this.state.partial.kind === CONSTRAINT_KIND.foreignKey) {
            return { required: ["references"], optional: [] };
          }
        }

      default:
        return { required: [], optional: [] };
    }
  }

  createStatement(): AlterTableStatement {
    switch (this.state.state) {
      case "add_column":
        return {
          kind: "alter_table",
          op: "add_column",
          table: this.table,
          column: this.state.column
        };

      case "drop_column":
        return {
          kind: "alter_table",
          op: "drop_column",
          table: this.table,
          columnName: this.state.columnName
        };

      case "rename_column":
        return {
          kind: "alter_table",
          op: "rename_column",
          table: this.table,
          from: this.state.from,
          to: this.state.to
        };

      case "modify_column":
        return {
          kind: "alter_table",
          op: "modify_column",
          table: this.table,
          columnName: this.state.columnName,
          column: this.state.column
        };

      case "add_constraint":
        if (!this.state.constraint) {
          throw new Error("Cannot create AlterTableStatement: constraint not fully defined");
        }
        return {
          kind: "alter_table",
          op: "add_constraint",
          table: this.table,
          constraint: this.state.constraint
        };
      
      case "drop_constraint":
        return {
          kind: "alter_table",
          op: "drop_constraint",
          table: this.table,
          constraintName: this.state.constraintName
        };

      default:
        throw new Error("Incomplete ALTER TABLE statement");
    }
  }
}