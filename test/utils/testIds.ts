import { type ColumnId } from "../../src/relational/Column.js";

let nextColumnId = 1;

export function testColumnId(): ColumnId {
  return nextColumnId++ as ColumnId;
}