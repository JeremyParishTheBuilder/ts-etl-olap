import type { ValidationViolationParticipant } from "./ValidationViolationParticipant.js";

export interface ValidationViolationSpec {
  readonly participants: readonly ValidationViolationParticipant[];
}

export class ValidationViolation {
  readonly participants: readonly ValidationViolationParticipant[];

  constructor(spec: ValidationViolationSpec) {
    this.participants = Object.freeze([...spec.participants]);
  }

  toJSON() {
    return {
      participants: this.participants.map((participant) => ({
        table: participant.table,
        tableName: participant.tableName,
        rowId: participant.rowId,
        columns: participant.columns,
        columnNames: participant.columnNames,
        columnValues: participant.columnValues,
        referencedTable: participant.referencedTable,
        referencedTableName: participant.referencedTableName,
        referencedColumns: participant.referencedColumns,
        referencedColumnNames: participant.referencedColumnNames,
      })),
    };
  }
}
