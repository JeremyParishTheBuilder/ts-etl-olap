import { Statement } from "../Statement.js";

import { Column }  from "../../types/Column.js";
import { AddColumnAction } from "../../actions/AddColumnAction.js";
import { DropColumnAction } from "../../actions/DropColumnAction.js";
import { RenameColumnAction } from "../../actions/RenameColumnAction.js";
import { AlterColumnAction } from "../../actions/AlterColumnAction.js";

import { ConstraintSpec, CONSTRAINT_KIND, DropConstraintSpec } from "../../types/Constraint.js";
import { AddConstraintAction } from "../../actions/AddConstraintAction.js";
import { DropConstraintAction } from "../../actions/DropConstraintAction.js";

export class AlterTableStatement extends Statement<void> {
  constructor(
    public table: string,
  ) {
    super();
  }

  add(column: Column) {
    this.addAction(new AddColumnAction(this.table, column));
  }

  dropColumn(name: string) {
    this.addAction(new DropColumnAction(this.table, name));
  }

  renameColumn(oldName: string, newName: string) {
    this.addAction(new RenameColumnAction(this.table, oldName, newName));
  }

  alterColumn(name: string, column: Column) {
    this.addAction(new AlterColumnAction(this.table, name, column));
  }

  addPrimaryKey(column: string) {
    const constraint: ConstraintSpec = {
      kind: CONSTRAINT_KIND.primaryKey,
      name: column,
      columns: [column]
    };
    this.addAction(new AddConstraintAction(this.table, constraint));
  }

  dropPrimaryKey() {
    this.addAction(new DropConstraintAction(
      this.table,
      { kind: CONSTRAINT_KIND.primaryKey } as DropConstraintSpec
    ));
  }

  addConstraint(name: string) {
    return new AddConstraintFragment(this, name);
  }

  dropConstraint(name: string) {
    this.addAction(new DropConstraintAction(this.table, { name: name } as DropConstraintSpec));
  }

}

class AddConstraintFragment {
  constructor(
    protected statement: AlterTableStatement,
    private constraintName: string,
  ) { }

  primaryKey(columns: string[]) {
    const constraint: ConstraintSpec = {
      kind: CONSTRAINT_KIND.primaryKey,
      name: this.constraintName,
      columns: columns
    };
    this.statement.addAction(new AddConstraintAction(this.statement.table, constraint));
  }

  unique(columns: string[]) {
    const constraint: ConstraintSpec = {
      kind: CONSTRAINT_KIND.unique,
      name: this.constraintName,
      columns: columns
    };
    this.statement.addAction(new AddConstraintAction(this.statement.table, constraint));
  }

  foreignKey(childColumns: string[]): ForeignKeyFragment {
    return new ForeignKeyFragment(this.statement, this.constraintName, childColumns);
  }

  //check() {} // TODO
}

class ForeignKeyFragment {
  constructor(
    protected statement: AlterTableStatement,
    private constraintName: string,
    private childColumns: string[],
  ) { }

  references(parentTable: string, parentColumns: string[]) {
    const constraint: ConstraintSpec = {
      kind: CONSTRAINT_KIND.foreignKey,
      name: this.constraintName,
      columns: this.childColumns,
      parentTable: parentTable,
      parentColumns: parentColumns
    };
    this.statement.addAction(new AddConstraintAction(this.statement.table, constraint));
  }
}