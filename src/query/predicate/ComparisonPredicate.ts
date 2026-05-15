import { type Predicate } from "./Predicate.js";
import { type RowView } from "../../schema/RowView.js";
import { type ColumnValue } from "../../schema/Column.js";
import { type ComparisonOperator } from "../../statements/WhereClause.js";

export class ComparisonPredicate implements Predicate {
  constructor(
    public columnIndex: number,
    public operator: ComparisonOperator,
    public value: ColumnValue,
  ) {}

  evaluate(row: RowView): boolean {
    assertColumnIndexWithinRow(this.columnIndex, row);

    const cell = row.values[this.columnIndex];

    if (cell === null || this.value === null) {
      return false;
    }

    switch (this.operator) {
      case "eq":
        return cell === this.value;

      case "ne":
        return cell !== this.value;

      case "gt":
      case "lt":
      case "gte":
      case "lte":
        if(!typesAreComparable(cell, this.value)) {
          return false;
        } 

        switch (this.operator) {
          case "gt": return cell > this.value;
          case "lt": return cell < this.value;
          case "gte": return cell >= this.value;
          case "lte": return cell <= this.value;
        }
      
      default:
        const _exhaustive: never = this.operator;
        throw new Error(`Unsupported operator: ${_exhaustive}`);
    }
  }
}

function assertColumnIndexWithinRow(idx: number, row: RowView): void {
  if (idx < 0 || idx >= row.values.length) {
    throw new Error(`Cell index out of bounds`);
  }
}

function typesAreComparable(a: ColumnValue, b: ColumnValue): boolean {
  if (
    (typeof a !== "number" && typeof a !== "string") ||
    (typeof b !== "number" && typeof b !== "string") ||
    typeof a !== typeof b
  ) {
    return false;
  }
  return true;
}