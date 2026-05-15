import { buildValueExtractor, Table } from './Table.js';
import { normalizeIdentifier } from '../utils/normalizeIdentifier.js';
import { type Column, type ColumnValue, isTypeCompatible } from './Column.js';
import { ForeignKey } from './ForeignKey.js';
import { Immutable } from "../infrastructure/Immutable.js";
import { Index } from './Index.js';
import { PersistentMap } from '../infrastructure/PersistentMap.js';


export class Database extends Immutable {
  public tables = new PersistentMap<string, Table>();

  constructor(public name: string) {
    super();
    this.validate();
    this.seal();
  }

  public validate() {}

  public requireTable(tableName: string): Table {
    return this.tables.require(normalizeIdentifier(tableName));
  }

  public addTable(table: Table): this {
    return this.with({
      tables: this.tables.add(normalizeIdentifier(table.name), table),
    } as Partial<this>);
  }

  public updateTable(table: Table): this {
    return this.with({
      tables: this.tables.update(normalizeIdentifier(table.name), table),
    } as Partial<this>);
  }

  public createTable(name: string) {
    return this.with({
      tables: this.tables.add(normalizeIdentifier(name), new Table(name)),
    } as Partial<this>);
  }

  public removeTable(name: string) {
    this.tables.forEach(t => 
      t.assertTableNameUnreferenced(name)
    );

    return this.with({
      tables: this.tables.remove(normalizeIdentifier(name)),
    } as Partial<this>);
  }

  public renameTable(
    oldName: string,
    newName: string,
  ): Database {
    const normalizedName = normalizeIdentifier(newName);

    if (normalizeIdentifier(oldName) === normalizedName) return this;

    const tablesWithUpdatedFkReferences = this.tables.mapValues(t => 
      t.tryRenameForeignKeyParentTable(oldName, newName)
    );

    const renamedTable = tablesWithUpdatedFkReferences
      .require(normalizeIdentifier(oldName))
      .rename(newName);

    const updatedTables = tablesWithUpdatedFkReferences
      .remove(normalizeIdentifier(oldName))
      .add(normalizedName, renamedTable);

    return this.with({
      tables: updatedTables,
    } as Partial<this>);
  }

  public addForeignKey(tableName: string, fk: ForeignKey): Database {
    const childTable = this.requireTable(tableName);
    const childColumns = childTable.requireColumns(fk.columns);

    const parentTable = this.requireTable(fk.parentTable);
    const parentColumns = parentTable.requireColumns(fk.parentColumns);

    assertForeignKeyColumnCompatibility(childColumns, parentColumns);

    const parentIndex =
      parentTable.requireUniqueIndexByColumns(fk.parentColumns);

    this.assertExistingRowsSatisfyForeignKey(
      childTable,
      childColumns,
      parentIndex
    );

    const updatedChildTable = childTable.addForeignKey(fk);

    return this.updateTable(updatedChildTable);
  }

  public assertExistingRowsSatisfyForeignKey(
    childTable: Table,
    childColumns: Column[],
    parentIndex: Index
  ) {
    childTable.forEachAliveRowValues(childColumns, (values, rowNum) => {
      if (values.includes(null)) return;

      if (!parentIndex.hasValues(values)) {
        throw new Error(`Foreign key violation on existing row ${rowNum}`);
      }
    });
  }
  //  </foreignKey>

  //Used in Database::removeColumn()
  public assertNoForeignKeyReferencesAny(
    tableName: string,
    columnNames: string[]
  ): void {
    const target = new Set(columnNames);

    this.tables.forEach(table => {
      table.foreignKeys.forEach(fk => { // TODO, replace with table function to avoid exposing internals
        if (
          fk.parentTable === tableName &&
          fk.parentColumns.some(col => target.has(col))
        ) {
          throw new Error(
            `Foreign key '${fk.name}' in table '${table.name}' references column(s) being modified'`
          );
        }
      });
    });
  }

  //Used in Database::removeConstraint()
  public assertNoForeignKeyReferencesExact(
    tableName: string,
    columnNames: string[]
  ): void {
    this.tables.forEach(table => {
      table.foreignKeys.forEach(fk => { // TODO,replace with table function to avoid exposing internals
        if (
          fk.parentTable === tableName &&
          arraysEqual(fk.parentColumns, columnNames)
        ) {
          throw new Error(
            `Foreign key '${fk.name}' in table '${table.name}' references columns being modified'`
          );
        }
      });
    });
  }

  public insertRow(tableName: string, row: ColumnValue[]): Database {
    const table: Table = this.requireTable(tableName);
    
    const normalizedRow = table.normalizeRow(row, "insert");

    this.verifyRowAgainstForeignKeys(normalizedRow, table);

    const updatedTable = table.insertNormalizedRow(normalizedRow);

    return this.updateTable(updatedTable);
  }

  public updateRow(
    tableName: string,
    updates: Map<number, ColumnValue>,
    rowNum: number,
  ): Database {
    const table: Table = this.requireTable(tableName);
    
    const existingRow: ColumnValue[] = table.requireRow(rowNum);

    const mergedRow: ColumnValue[] = table.mergeRow(existingRow, updates); // TODO, make sure if have indexes

    const normalizedRow = table.normalizeRow(mergedRow, "update");

    this.verifyRowAgainstForeignKeys(normalizedRow, table);

    const updatedTable = table.updateNormalizedRow(normalizedRow, rowNum);

    return this.updateTable(updatedTable);
  }

  private verifyRowAgainstForeignKeys(row: ColumnValue[], table: Table): void {
    for (const fk of table.foreignKeys.values()) {
      const extractChildValues = buildValueExtractor(table.columns, fk.columns);

      const childValues = extractChildValues(row);

      if (childValues.some(v => v === null)) {
        continue;
      }

      const parentTable = this.requireTable(fk.parentTable);
      const parentIndex = parentTable.requireUniqueIndexByColumns(fk.parentColumns);

      if (!parentIndex.hasValues(childValues)) {
        throw new Error(
          `FK violation: (${fk.columns.join(",")}) ->
          ${fk.parentTable}(${fk.parentColumns.join(",")})`
        );
      }
    }
  }

  public renameColumn(
    tableName: string,
    oldColumnName: string,
    newColumnName: string,
  ): Database {
    const normalizedName = normalizeIdentifier(newColumnName);

    if (normalizeIdentifier(oldColumnName) === normalizedName) return this;

    const tablesWithUpdatedFkReferences = this.tables.mapValues(t => 
      t.tryRenameForeignKeyParentColumn(
        tableName,
        oldColumnName,
        newColumnName,
      )
    );

    const tableWithRenamedColumn = tablesWithUpdatedFkReferences
      .require(normalizeIdentifier(tableName))
      .renameColumn(oldColumnName, newColumnName);

    const updatedTables = tablesWithUpdatedFkReferences
     .update(normalizeIdentifier(tableName), tableWithRenamedColumn);

    return this.with({
      tables: updatedTables,
    } as Partial<this>);
  }

  public removeColumn(
    tableName: string,
    columnName: string,
  ): Database {
    const table = this.requireTable(tableName);

    this.assertNoForeignKeyReferencesAny(tableName, [columnName])

    const newTable = table.removeColumn(columnName);

    return this.updateTable(newTable);
  }
}
//  </dropConstraint>

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }

  return true;
}

//used for: addForeignKey
function assertForeignKeyColumnCompatibility(
  childColumns: Column[],
  parentColumns: Column[],
): void {
  if (childColumns.length !== parentColumns.length) {
    throw new Error("Column count mismatch");
  }

  for (let i = 0; i < childColumns.length; i++) {
    const child = childColumns[i];
    const parent = parentColumns[i];

    if (!isTypeCompatible(child.type, parent.type)) {
      throw new Error(
        `Column type mismatch: ` +
        `'${child.name}' (${child.type}) ` +
        `!= '${parent.name}' (${parent.type})`
      );
    }
  }
}