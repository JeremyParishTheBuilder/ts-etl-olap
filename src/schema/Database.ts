import { Table } from './Table.js';
import { normalizeIdentifier } from '../utils/normalizeIdentifier.js';
import { type Column, type ColumnValue, isTypeCompatible } from './Column.js';
import { ForeignKey } from './ForeignKey.js';
import { Immutable } from "../infrastructure/Immutable.js";
import { PersistentMap } from '../infrastructure/PersistentMap.js';
import { ForeignKeySpec } from './Constraint.js';
import { ReferentialAction } from './ReferentialAction.js';
import { RowView } from './RowView.js';

const MAX_DEPTH = 25;

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

  public createForeignKey(tableName: string, spec: Omit<ForeignKeySpec, "kind">): Database {
    const childTable = this.requireTable(tableName);
    const childColumns = childTable.requireColumns(spec.columns);

    const parentTable = this.requireTable(spec.parentTable);
    const parentColumns = parentTable.requireColumns(spec.parentColumns);
    const parentIndex = parentTable.requireUniqueIndexByColumns(spec.parentColumns);

    assertForeignKeyColumnCompatibility(childColumns, parentColumns);

    const updatedChildTable = childTable.createForeignKey({
      ...spec,
      parentIndex: parentIndex.name,
    });

    const foreignKey = updatedChildTable.requireForeignKey(spec.name);

    this.assertExistingRowsSatisfyForeignKey(
      childTable,
      foreignKey,
      //parentIndex
    );

    return this.updateTable(updatedChildTable);
  }

  public assertExistingRowsSatisfyForeignKey(
    childTable: Table,
    foreignKey: ForeignKey,
    //parentIndex: Index
  ) {
    const parentIndex = this
      .requireTable(foreignKey.parentTable)
      .requireIndex(foreignKey.parentIndex);

    for(const row of childTable.iterateAliveRows()) {
      const projected = foreignKey.getProjectedValues(row.values);

      if (projected.includes(null)) continue;

      if (!parentIndex.hasProjectedValues(projected)) { // does RESTRICT affect this?
        throw new Error(`Foreign key violation on existing row ${row.index}`);
      }
    }
  }
  //  </foreignKey>

  //Used in Database::removeColumn()
  public assertNoForeignKeyReferencesAny(
    tableName: string,
    columnNames: string[]
  ): void {
    const target = new Set(columnNames);

    this.tables.forEach(table => {
      table.foreignKeys.forEach(fk => {
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

  //Used in Database::removeIndex(), not yet written, but may be used by a foreignKey
  public assertNoForeignKeyReferencesExact(
    tableName: string,
    columnNames: string[]
  ): void {
    this.tables.forEach(table => {
      table.foreignKeys.forEach(fk => {
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

  public addRow(tableName: string, row: ColumnValue[]): Database {
    const table: Table = this.requireTable(tableName);
    
    const normalizedRow = table.normalizeRow(row, "insert");

    const updatedTable = table.addRow(normalizedRow);

    this.validateChildRowAgainstForeignKeys(normalizedRow, updatedTable);

    return this.updateTable(updatedTable);
  }

  // private findNextReferencingRow(
  //   parentTableName: string,
  //   row: RowView,
  // ): {
  //   foreignKey: ForeignKey,
  //   childTableName: string,
  //   childRowNum: number,
  // } | undefined {
  //   const parentTable = this.requireTable(parentTableName);

  //   for (const table of this.tables.values()) {
  //     const childTableName = normalizeIdentifier(table.name);
  //     for (const fk of table.foreignKeys.values()) {
  //       if (fk.parentTable !== normalizeIdentifier(parentTableName)) continue;

  //       const parentIndex = parentTable.requireIndex(fk.parentIndex);
  //       const projection = parentIndex.getProjectedValues(row.values);
  //       const reverseIndex = table.requireIndex(fk.reverseIndex);
  //       const currentRows = reverseIndex.getRowNumsFromProjection(projection);

  //       if (!currentRows?.length) continue;
  //       for (const childRowNum of currentRows) {
  //         if (
  //           normalizeIdentifier(table.name) ===
  //           normalizeIdentifier(parentTableName) &&
  //           row.index === childRowNum
  //         ) {
  //           continue;
  //         }

  //         return {
  //           foreignKey: fk,
  //           childTableName,
  //           childRowNum,
  //         };
  //       }
  //     }
  //   }
  // }

  private findChildRowReferences(
    parentTableName: string,
    row: RowView,
  ): Array<{
    foreignKey: ForeignKey,
    childTableName: string,
    childRowNum: number,
  }> {
    const childRowReferences = [];

    const parentTable = this.requireTable(parentTableName);
    for (const table of this.tables.values()) {
      const childTableName = normalizeIdentifier(table.name);
      for (const fk of table.foreignKeys.values()) {
        if (fk.parentTable !== normalizeIdentifier(parentTableName)) continue;

        const parentIndex = parentTable.requireIndex(fk.parentIndex);
        const projection = parentIndex.getProjectedValues(row.values);
        const reverseIndex = table.requireIndex(fk.reverseIndex);
        const currentRows = reverseIndex.getRowNumsFromProjection(projection);

        if (!currentRows?.length) continue;
        for (const childRowNum of currentRows) {
          childRowReferences.push({
            foreignKey: fk,
            childTableName,
            childRowNum,
          });
        }
      }
    }

    return childRowReferences;
  }

  private tryApplyReferentialAction(spec: {
    childRowReference: {
      foreignKey: ForeignKey,
      childTableName: string,
      childRowNum: number,
    },
    mode: "update" | "delete",
    updates?: Map<number, ColumnValue>,
    depth: number,
  }): Database {
    let updatedDatabase: Database = this;

    const referentialAction = spec.mode === "delete" ?
      spec.childRowReference.foreignKey.onDelete :
      spec.childRowReference.foreignKey.onUpdate;

    let childRowUpdates;
    if (spec.mode === "update" && spec.updates) {
      childRowUpdates = this.convertUpdatesForChildRowReference(
        spec.childRowReference.foreignKey,
        spec.childRowReference.childTableName,
        spec.updates,
      );

      if (childRowUpdates.size < 1) return updatedDatabase;
    }
    
    switch (referentialAction) {
      case ReferentialAction.restrict:
        throw new Error(`Child Table references Parent Row`);
      case ReferentialAction.noAction:
        break;
      case ReferentialAction.setNull:
        const nullUpdates = new Map<number, ColumnValue>();
        spec.childRowReference.foreignKey.columnIndexes.forEach(i => {
          nullUpdates.set(i, null);
        });
        updatedDatabase = updatedDatabase.tryUpdateRow(
          spec.childRowReference.childTableName,
          spec.childRowReference.childRowNum,
          nullUpdates,
          spec.depth + 1,
        );
        break;
      case ReferentialAction.cascade:
        if (spec.mode === "delete") {
          updatedDatabase = updatedDatabase.tryRemoveRow(
            spec.childRowReference.childTableName,
            spec.childRowReference.childRowNum,
            spec.depth + 1,
          );
        } else {
          if (!childRowUpdates) throw new Error(`Missing child row updates`);
          updatedDatabase = updatedDatabase.tryUpdateRow(
            spec.childRowReference.childTableName,
            spec.childRowReference.childRowNum,
            childRowUpdates,
            spec.depth + 1,
          );
        }
        break;
      default:
        throw new Error(`No Referential Action specified for foreign key.`);
    }

    return updatedDatabase;
  }

  public convertUpdatesForChildRowReference(
    foreignKey: ForeignKey,
    childTableName: string,
    parentRowUpdates: Map<number, ColumnValue>,
  ): Map<number, ColumnValue> {
    const childReferenceUpdates = new Map<number, ColumnValue>();

    const parentTable = this.requireTable(foreignKey.parentTable);
    const parentColumns = parentTable.requireColumns(foreignKey.parentColumns);

    const parentColumnNameToParentColumnIndex = new Map<string, number>();
    parentColumns.forEach(column => {
      if (
        !foreignKey.parentColumns.includes(normalizeIdentifier(column.name))
      ) return;
      parentColumnNameToParentColumnIndex.set(
        normalizeIdentifier(column.name),
        column.position
      )
    });

    const childColumnNameToParentColumnName = new Map<string, string>();
    for (let i = 0; i < foreignKey.columns.length; i++) {
      childColumnNameToParentColumnName.set(
        foreignKey.columns[i],
        foreignKey.parentColumns[i]
      );
    }
    
    const childTable = this.requireTable(childTableName);
    
    for (const childColumnName of foreignKey.columns) {
      const childColumn = childTable.requireColumn(childColumnName);
      const childColumnIndex = childColumn.position;
      const parentColumnName = childColumnNameToParentColumnName.get(childColumnName);
      if (!parentColumnName) throw new Error(`No corresponding parentColumnName`);
      const parentColumnIndex = parentColumnNameToParentColumnIndex.get(parentColumnName);
      if (parentColumnIndex === undefined) throw new Error(`No corresponding parentColumnIndex`);
      if (!parentRowUpdates.has(parentColumnIndex)) continue; // no update to cascade
      const updateValue = parentRowUpdates.get(parentColumnIndex);
      if (updateValue === undefined) throw new Error(`No corresponding update value`);
      childReferenceUpdates.set(childColumnIndex, updateValue);
    }

    return childReferenceUpdates;
  }

  private tryRemoveRow(
    tableName: string,
    rowNum: number,
    depth: number
  ): Database {
    if (depth >= MAX_DEPTH) {
      throw new Error(`Reached max recursion depth ${MAX_DEPTH}`);
    }

    const table: Table = this.requireTable(tableName);

    if (table.rowAlive[rowNum] === false) return this;

    const removedRow = table.requireRowView(rowNum);

    const tableWithRowRemoved = table.removeRow(rowNum);

    const dbWithRowRemoved: Database = this.updateTable(tableWithRowRemoved);

    let updatedDatabase = dbWithRowRemoved;
    
    
    let dbWithReferenceUpdated;

    while (true) {
      const childRowReferences = updatedDatabase.findChildRowReferences(
        tableName,
        removedRow,
      );

      let mutation = false;
      for (const childRowReference of childRowReferences) {
        if (
          normalizeIdentifier(tableName) ===
          normalizeIdentifier(childRowReference.childTableName) &&
          rowNum === childRowReference.childRowNum
        ) {
          continue;
        }

        dbWithReferenceUpdated = updatedDatabase.tryApplyReferentialAction({
          childRowReference,
          mode: "delete",
          depth,
        });

        if (dbWithReferenceUpdated === updatedDatabase) continue;
        
        mutation = true;
        break;
      }

      if (dbWithReferenceUpdated && mutation) {
        updatedDatabase = dbWithReferenceUpdated;
      } else {
        break;
      }
    }

    return updatedDatabase;
  }

  public removeRow(tableName: string, rowNum: number): Database {
    const table: Table = this.requireTable(tableName); 

    table.assertRowAlive(rowNum);

    const updatedDatabase = this.tryRemoveRow(tableName, rowNum, 0);

    updatedDatabase.assertAllForeignKeysValid();

    return updatedDatabase;
  }

  public updateRow(
    tableName: string,
    rowNum: number,
    updates: Map<number, ColumnValue>,
  ): Database {
    const table: Table = this.requireTable(tableName); 

    table.assertRowAlive(rowNum);

    const updatedDatabase = this.tryUpdateRow(tableName, rowNum, updates, 0);

    updatedDatabase.assertAllForeignKeysValid();

    return updatedDatabase;
  }

  private tryUpdateRow(
    tableName: string,
    rowNum: number,
    updates: Map<number, ColumnValue>,
    depth: number,
  ): Database {
    if (depth >= MAX_DEPTH) {
      throw new Error(`Reached max recursion depth ${MAX_DEPTH}`);
    }

    const table: Table = this.requireTable(tableName);

    if (table.rowAlive[rowNum] === false) return this;

    const existingRow: RowView = table.requireRowView(rowNum);

    const mergedRow: ColumnValue[] = table.mergeRow(existingRow.values, updates); // TODO, make sure if have indexes

    const normalizedRow = table.normalizeRow(mergedRow, "update");

    const tableWithRowUpdated = table.updateRow(normalizedRow, rowNum);

    const dbWithRowUpdated: Database = this.updateTable(tableWithRowUpdated);

    let updatedDatabase = dbWithRowUpdated;
    let dbWithReferenceUpdated;

    while (true) {

      const childRowReferences = updatedDatabase.findChildRowReferences(
        tableName,
        existingRow,
      );

      let mutation = false;
      for (const childRowReference of childRowReferences) {
        if (
          normalizeIdentifier(tableName) ===
          normalizeIdentifier(childRowReference.childTableName) &&
          rowNum === childRowReference.childRowNum
        ) {
          continue;
        }

        dbWithReferenceUpdated = updatedDatabase.tryApplyReferentialAction({
          childRowReference,
          mode: "update",
          updates,
          depth,
        });

        if (dbWithReferenceUpdated === updatedDatabase) continue;
        
        mutation = true;
        break;
      }

      if (dbWithReferenceUpdated && mutation) {
        updatedDatabase = dbWithReferenceUpdated;
      } else {
        break;
      }
    }

    return updatedDatabase;
  }

  private validateChildRowAgainstForeignKeys(row: ColumnValue[], childTable: Table): void {
     childTable.foreignKeys.forEach(fk => {
      const projected = fk.getProjectedValues(row);

      if (projected.includes(null)) return;

      const latestParentTable =
        fk.parentTable === normalizeIdentifier(childTable.name) ?
        childTable :
        this.requireTable(fk.parentTable);

      const parentIndex = latestParentTable.requireIndex(fk.parentIndex);

      if (!parentIndex.hasProjectedValues(projected)) {
        throw new Error(
          `FK violation: (${fk.columns.join(",")}) ->
          ${fk.parentTable}(${fk.parentColumns.join(",")})`
        );
      }
    });
  }

  private assertAllForeignKeysValid(): void {
    this.tables.forEach(table => {
      table.foreignKeys.forEach(fk => {
        this.assertExistingRowsSatisfyForeignKey(table, fk);
      });
    });
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

    const updatedTable = table.removeColumn(columnName);

    return this.updateTable(updatedTable);
  }

  public removeIndex(tableName: string, indexName: string): Database {
    const table = this.requireTable(tableName);

    const index = table.requireIndex(indexName);

    for (const childTable of this.tables.values()) {
      for(const fk of childTable.foreignKeys.values()) {
        if (
          fk.parentTable === normalizeIdentifier(tableName)
        ) {
          const fkParentIndex = table.requireIndex(fk.parentIndex);
          if (fkParentIndex === index) {
            throw new Error(
              `Index is Parent for Foreign Key: ${fk.name} of Child Table: ${childTable.name}`
            );
          }
        }
      }
    }

    const updatedTable = table.removeIndex(indexName);

    return this.updateTable(updatedTable);
  }

  public renameIndex(tableName: string, oldName: string, newName: string): Database {
    if (oldName === newName) return this;

    const tableWithRenamedIndex = this.requireTable(tableName)
      .renameIndex(oldName, newName);

    let updatedTables = this.tables;

    const normalizedOldName = normalizeIdentifier(oldName);
    const normalizedNewName = normalizeIdentifier(newName);

    this.tables.forEach(table => {
      const latestTable =
        normalizeIdentifier(table.name) ===
        normalizeIdentifier(tableWithRenamedIndex.name) ?
        tableWithRenamedIndex :
        table;

      let updatedTable = latestTable;
      latestTable.foreignKeys.forEach(fk => {
        if (fk.parentIndex === normalizedOldName) {
          const updatedFk = fk.withParentIndex(normalizedNewName);
          updatedTable = updatedTable.updateForeignKey(updatedFk);
        }
      });

      if (table !== updatedTable) {
        updatedTables
          .remove(normalizedOldName)
          .add(normalizedNewName, updatedTable);
      }
    });

    return this.with({
      tables: updatedTables,
    } as Partial<this>);
  }
}

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