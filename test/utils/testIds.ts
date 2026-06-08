import { type ColumnId } from "../../src/schema/Column.js";

let nextColumnId = 1;

export function testColumnId(): ColumnId {
  return nextColumnId++ as ColumnId;
}