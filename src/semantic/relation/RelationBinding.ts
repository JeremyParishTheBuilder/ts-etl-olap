import type { Table } from "../../relational/Table.js";
import {
  relationColumnsFromTable,
  type RelationColumn,
} from "./RelationColumn.js";

export interface RelationBinding {
  name?: string;
  columns: readonly RelationColumn[];
}

export function relationBindingFromTable(table: Table): RelationBinding {
  return {
    name: table.name,
    columns: relationColumnsFromTable(table),
  };
}
