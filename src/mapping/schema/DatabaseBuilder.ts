import { type ColumnValue } from "../../types/ColumnValue.js";
import { type Database } from "../../schema/Database.js";
import { type Databases } from "../../schema/Databases.js";
import { ImportResult } from "../import/ImportResult.js";
import { ImportRowIdentity } from "../import/ImportRowIdentity.js";
import { type DatabaseSchema } from "./DatabaseSchema.js";

export class DatabaseBuilder {
  constructor(
    private readonly dbName: string,
    private readonly schema: DatabaseSchema,
    private readonly imports: ImportResult[],
  ) {}

  build(databases: Databases): Databases {
    let updatedDatabases: Databases = databases.create({
      name: this.dbName,
    });

    let database = updatedDatabases.requireByName(this.dbName);

    for (const tableSchema of this.schema.tables.values()) {

      database = database.createTable({name: tableSchema.name});

      let table = database.tables.requireByName(tableSchema.name);

      for (const columnSchema of tableSchema.columns.values()) {
        table = table.createColumn({
          name: columnSchema.name,
          type: columnSchema.type,
        });
      }

      database = database.updateTable(table);
    }

    //TODO
    const groupedImports = groupImports(this.imports);
    const assembledLogicalRows = assembleLogicalRows(groupedImports);
    const resolvedInserts = bindLogicalRows(assembledLogicalRows, database);

    for (const insert of resolvedInserts) {
      database = database.addRow(insert.tableName, insert.values);
    }

    return updatedDatabases.update(database);
  }
}

type TableName = string;
type GroupedImports = Map<TableName, ImportResult[]>;
// by tableName

// Phase 1: Group Imports.
function groupImports(imports: ImportResult[]): Map<string, ImportResult[]> {
  const groupedImports = new Map<string, ImportResult[]>();

  for (const importResult of imports) {
    if (!groupedImports.get(importResult.mapping.tableName)) {
      groupedImports.set(importResult.mapping.tableName, [])
    }

    groupedImports.get(importResult.mapping.tableName)!.push(importResult);
  }

  return groupedImports;
}


interface ResolvedInsert {
  tableName: string;
  values: ColumnValue[];
}

interface LogicalRow {
  tableName: string;
  rowIdentity: ImportRowIdentity;
  values: Record<string, ColumnValue>;
}

type MergedGroupedImports = Map<TableName, Map<string, LogicalRow>>;

// Phase 2: Merge imports belonging to the same logical row.
function assembleLogicalRows(groupedImports: GroupedImports): MergedGroupedImports {
  const mergedGroupedImports = new Map<TableName, Map<string, LogicalRow>>();

  for (const [tableName, imports] of groupedImports) {
    const logicalRows = new Map<string, LogicalRow>();

    for (const importResult of imports) {
      const rowIdentity = importResult.rowIdentity;

      // const rowIdentity = importResult.mapping.resolveImportRowIdentity(
      //   importResult.values
      // ); // error, this function was replaced
      //const rowIdentity = importResult.mapping.resolveRowKey(importResult); // error, this function was replaced

      const key = rowIdentity.toString();

      if (!logicalRows.get(key)) {
        logicalRows.set(key, {
          tableName,
          rowIdentity,
          values: {}
        })
      }

      let logicalRow = logicalRows.get(key);

      for (const [propertyName, value] of importResult.values) {
        logicalRow!.values[propertyName] = value as ColumnValue;
      }

      mergedGroupedImports.set(tableName, logicalRows);
    }
  }

  return mergedGroupedImports;
}

type BoundMergedGroupedImports = Map<string, Map<string, ResolvedInsert>>;

// Phase 3: Bind to the schema.
function bindLogicalRows(
  mergedGroupedImports: MergedGroupedImports,
  database: Database,
): ResolvedInsert[] {
  const resolvedInserts: ResolvedInsert[] = [];
  //for each table,
  for (const [tableName, logicalRows] of mergedGroupedImports) {
    // find the table from db
    const table = database.tables.requireByName(tableName);
    // for each LogicalRow
    for (const [rowIdentity, logicalRow] of logicalRows) {
      // create a ResolvedInsert--later
      const values: ColumnValue[] =
        new Array(table.columns.size()).fill(null);
      // for each property in values
      for (const [propertyName, value] of Object.entries(logicalRow.values)) {
        // find the column position
        const columnPosition = table.columns.requireByName(propertyName).position;
        // add value to resolved insert's values array
        values[columnPosition] = value;
      }
      // add resolved insert to array
      const resolvedInsert = {
        tableName,
        values,
      };

      resolvedInserts.push(resolvedInsert);
    }
  }
  //return array or resolved inserts
  return resolvedInserts;
}