import type { ColumnValue } from "../types/ColumnValue.js";
import type { ColumnId } from "./Column.js";
import type { CONSTRAINT_KIND } from "./ConstraintKind.js";
import type { TableId } from "./Table.js";

export interface ConstraintViolationErrorSpec {
  constraintName: string;
  constraintKind: CONSTRAINT_KIND;
  participants: readonly ConstraintViolationParticipant[];
  message?: string;
  cause?: Error;
}

export class ConstraintViolationError extends Error {
  readonly constraintName: string;
  readonly constraintKind: CONSTRAINT_KIND;
  readonly participants: readonly ConstraintViolationParticipant[];
  readonly cause?: Error;

  constructor(spec: ConstraintViolationErrorSpec) {
    const message = spec.message ??
      `${spec.constraintKind} constraint violation`;

    super(message);

    this.constraintName = spec.constraintName;
    this.constraintKind = spec.constraintKind;
    this.participants = spec.participants;
    this.cause = spec.cause;
  }
}

export interface ConstraintViolationParticipant {
  readonly table: TableId;
  readonly rowId: number;
  readonly columns: readonly ColumnId[];
  readonly columnValues: readonly ColumnValue[];

  readonly referencedTable?: TableId;
  readonly referencedColumns?: readonly ColumnId[];

  readonly tableName?: string;
  readonly columnNames?: readonly string[];

  readonly referencedTableName?: string;
  readonly referencedColumnNames?: readonly string[];
}
