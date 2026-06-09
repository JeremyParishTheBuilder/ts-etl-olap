import { Table, type TableId } from './Table.js';
import { normalizeIdentifier } from '../utils/normalizeIdentifier.js';
import { type Column, type ColumnId, type ColumnValue, isTypeCompatible } from './Column.js';
import { 
  CompiledForeignKey,
  type ForeignKey,
} from './ForeignKey.js';
import { Immutable } from "../infrastructure/Immutable.js";
import { PersistentMap } from '../infrastructure/PersistentMap.js';
import { ReferentialAction } from './ReferentialAction.js';
import { RowView } from './RowView.js';
import { IdAllocator } from '../types/IdAllocator.js';

const MAX_DEPTH = 25;

export class Database extends Immutable {
  public readonly name: string;

  public readonly tables: PersistentMap<TableId, Table>;
  public readonly tableNames: PersistentMap<string, TableId>;

  public readonly tableIds //= new IdAllocator<ColumnId>();

  constructor(/*spec: {*/
    name: string,
  /*}*/) {
    super();

    this.name = /*spec.*/name;

    this.tables = new PersistentMap();
    this.tableNames = new PersistentMap();

    this.tableIds = new IdAllocator<TableId>();

    this.validate();
    this.seal();
  }

  public validate() {}

  public getTableIdByName(name: string): TableId | undefined {
    const tableId = this.tableNames.get(normalizeIdentifier(name));
    return tableId;
  }

  public requireTableIdByName(name: string): TableId {
    const tableId = this.getTableIdByName(name);
    if (!tableId) {
      throw new Error(`Table Name: "${name}" not found`);
    }
    return tableId;
  }

  public getTable(name: string): Table | undefined {
    const tableId = this.getTableIdByName(name);
    if (!tableId) return undefined;
    return this.tables.get(tableId);
  }

  public requireTable(name: string): Table {
    const table = this.getTable(name);
    if (!table) {
      throw new Error(`Table: ${name} not found`);
    }
    return table;
  }

  public getTableById(id: TableId): Table | undefined {
    return this.tables.get(id);
  }

  public requireTableById(id: TableId): Table {
    const table = this.getTableById(id);
    if (!table) {
      throw new Error(`Table Id: ${id} not found`);
    }
    return table;
  }

  // public requireTable(tableName: string): Table {
  //   return this.tables.require(normalizeIdentifier(tableName));
  // }

  public addTable(table: Table): this {
    return this.with({
      tables: this.tables.add(table.id, table),
      tableNames: this.tableNames.add(normalizeIdentifier(table.name), table.id),
    } as Partial<this>);
  }

  public createTable(spec: { name: string }): this {
    this.assertTableNameUnused(spec.name);

    const [id, tableIds] = this.tableIds.allocate();

    const table = Table.create({...spec, id});

    const updatedTables = this.tables.add(id, table);

    const updatedTableNames = this.tableNames.add(
      normalizeIdentifier(spec.name),
      id
    );

    return this.with({
      tables: updatedTables,
      tableNames: updatedTableNames,
      tableIds,
    } as Partial<this>);
  }

  public updateTable(table: Table): this {
    return this.with({
      tables: this.tables.update(table.id, table),
      tableNames: this.tableNames.update(table.name, table.id),
    } as Partial<this>);
  }

  // public createTable(name: string) {
  //   return this.with({
  //     tables: this.tables.add(normalizeIdentifier(name), new Table(name)),
  //   } as Partial<this>);
  // }

  public removeTable(name: string): Database {
    return this.removeTableById(this.requireTableIdByName(name));
  }

  public removeTableById(id: TableId): Database {
    this.tables.forEach(t => t.assertTableUnreferenced(id)
      //t.assertTableNameUnreferenced(name) // TODO, update from referenced names to referenced ids
    );

    const table = this.requireTableById(id);

    const updatedTables = this.tables.remove(id);

    const updatedTableNames = this.tableNames.remove(table.name);

    return this.with({
      tables: updatedTables,
      tableNames: updatedTableNames,
    } as Partial<this>);
  }

  public renameTable(name: string, newName: string): Database {
    return this.renameTableById(
      this.requireTableIdByName(name),
      newName
    );
  }
  
  public renameTableById(id: TableId, newName: string): Database {
    const table = this.requireTableById(id);

    const oldName = table.name;

    if (oldName === newName) return this;

    const normalizedOldName = normalizeIdentifier(oldName);
    const normalizedNewName = normalizeIdentifier(newName);

    if (normalizedOldName !== normalizedNewName) {
      this.assertTableNameUnused(newName);
    }

    const renamedTable = table.rename(newName);

    const updatedTables = this.tables.update(id, renamedTable);

    const updatedTableNames = this.tableNames
      .remove(normalizedOldName)
      .add(normalizedNewName, id);

    return this.with({
      tables: updatedTables,
      tableNames: updatedTableNames,
    } as Partial<this>);
  }

  private assertTableNameUnused(name: string): void {
    if (this.tableNames.has(normalizeIdentifier(name))) {
      throw new Error(`Table name ${name} is already used`);
    }
  }

  //Database is where ForeignKey should resolve names to ids
  public createForeignKey(
    tableName: string,
    spec: {
      name: string,
      columns: string[],
      reverseIndex: string,
      parentTable: string,
      parentColumns: string[],
      onDelete?: ReferentialAction,
      onUpdate?: ReferentialAction,
  }): Database {
    const childTable = this.requireTable(tableName);

    const childColumnIds = spec.columns.map(c => childTable.requireColumnIdByName(c));
    const childColumns = childColumnIds.map(c => childTable.requireColumnById(c));

    const reverseIndex = childTable.requireIndex(spec.reverseIndex);

    const parentTable = this.requireTable(spec.parentTable);

    const parentColumnIds = spec.parentColumns.map(c => parentTable.requireColumnIdByName(c));
    const parentColumns = parentColumnIds.map(c => parentTable.requireColumnById(c));

    const parentIndex = parentTable.requireUniqueIndexByColumns(parentColumnIds);

    assertForeignKeyColumnCompatibility(childColumns, parentColumns);

    const updatedChildTable = childTable.createForeignKey({
      ...spec,
      columns: childColumnIds,
      reverseIndex: reverseIndex.id,
      parentTable: parentTable.id,
      parentColumns: parentColumnIds,
      parentIndex: parentIndex.id,
    });

    const foreignKey = updatedChildTable.requireForeignKey(spec.name);

    this.assertExistingRowsSatisfyForeignKey(
      childTable,
      foreignKey,
    );

    return this.updateTable(updatedChildTable);
  }

  public assertExistingRowsSatisfyForeignKey(
    childTable: Table,
    foreignKey: ForeignKey,
  ) {
    const parentIndex = this
      .requireTableById(foreignKey.parentTable)
      .requireIndexById(foreignKey.parentIndex);

    const reverseIndex = childTable
      .requireIndexById(foreignKey.reverseIndex);

    console.log("asserting...");
    console.log(childTable.name);
    console.log(foreignKey);

    for(const row of childTable.iterateAliveRows()) {
      console.log(row);
      const projected = reverseIndex.projectValues(row.values);

      if (projected.includes(null)) continue;

      if (!parentIndex.hasProjectedValues(projected)) {
        throw new Error(`Foreign key violation on existing row ${row.index}. ${projected}`);
      }
    }
  }
  //  </foreignKey>

  //Used in Database::removeColumn()
  public assertNoForeignKeyReferencesAny(
    tableId: TableId,
    columns: ColumnId[]
  ): void {
    const target = new Set(columns);

    this.tables.forEach(table => {
      table.foreignKeys.forEach(fk => {
        if (
          fk.parentTable === tableId &&
          fk.parentColumns.some(col => target.has(col))
        ) {
          throw new Error(
            `Foreign key '${fk.name}' in table '${table.name}' references column(s) being modified'`
          );
        }
      });
    });
  }

  //Used in Database::removeIndex(), not yet written, but may be used by a foreignKey // TODO
  public assertNoForeignKeyReferencesExact(
    tableId: TableId,
    columnNames: string[]
  ): void {
    this.tables.forEach(table => {
      table.foreignKeys.forEach(fk => {
        if (
          fk.parentTable === tableId &&
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
    
    //const normalizedRow = table.normalizeRow(row, "insert");

    const updatedTable = table.addRow(row);

    this.validateChildRowAgainstForeignKeys(row, updatedTable);

    return this.updateTable(updatedTable);
  }

  private findImpactedChildRowReferences(
    //parentTableName: string,
    parentTableId: TableId,
    parentRow: RowView,
  ): Array<{
    foreignKey: ForeignKey,
    //childTableName: string,
    childTableId: TableId,
    childRowNum: number,
  }> {
    const childRowReferences = [];

    //const parentTable = this.requireTable(parentTableName);
    const parentTable = this.requireTableById(parentTableId);

    for (const table of this.tables.values()) {
      //const childTableName = normalizeIdentifier(table.name);

      for (const foreignKey of table.foreignKeys.values()) {
        //if (foreignKey.parentTable !== normalizeIdentifier(parentTableName)) continue;
        if (foreignKey.parentTable !== parentTable.id) continue;

        const reverseIndex = table.requireIndexById(foreignKey.reverseIndex);

        const parentIndex = parentTable.requireIndexById(foreignKey.parentIndex);
        const projection = parentIndex.projectValues(parentRow.values);

        // console.log("finding references....");
        // console.log(foreignKey);
        // console.log(reverseIndex);
        // console.log(parentRow);
        // console.log(projection);

        
        const currentRows = reverseIndex.getRowNumsFromProjection(projection);

        // console.log("currentRows");
        // console.log(currentRows);

        if (!currentRows?.length) continue;
        for (const childRowNum of currentRows) {

          // No-op when no impact to parent projection
          if (parentTable.isRowAlive(parentRow.index)) {
            const replacementRow = parentTable.requireRow(parentRow.index);
            const replacementRowProjection =
              parentIndex.projectValues(replacementRow);

            // console.log("Replace?");
            // console.log(parentRow);
            // console.log(projection);

            if (arraysEqual(projection, replacementRowProjection)) continue;
          }

          childRowReferences.push({
            foreignKey,
            //childTableName,
            childTableId: table.id,
            childRowNum,
          });
        }
      }
    }

    return childRowReferences;
  }

  // private applyReferentialActionToRowOld(
  //   existingChildRow: ColumnValue[],
  //   replacementParentRow: readonly ColumnValue[],
  //   compiledFk: CompiledForeignKey,
  //   action: ReferentialAction,
  // ): ColumnValue[] {
  //   let next: ColumnValue[];
  //   switch (action) {
  //     case ReferentialAction.restrict:
  //     case ReferentialAction.noAction:
  //       return existingChildRow;
  //     case ReferentialAction.setNull:
  //       next = [...existingChildRow];

  //       compiledFk.columnIndexes.forEach(idx => {
  //         next[idx] = null;
  //       });

  //       return next;
  //     case ReferentialAction.cascade:
  //       next = [...existingChildRow];

  //       compiledFk.columnIndexes.forEach((childIdx, i) => {         
  //         const parentIdx = compiledFk.parentColumnIndexes[i];
  //         next[childIdx] = replacementParentRow[parentIdx];
  //       });

  //       return next;
  //     default:
  //       throw new Error(`No Referential Action specified for foreign key.`);
  //   }
  // }

  private tryApplyReferentialAction(spec: {
    childRowReference: {
      foreignKey: CompiledForeignKey,
      //childTableName: string,
      childTableId: TableId,
      childRowNum: number,
    },
    mode: "update" | "delete",
    oldRow: readonly ColumnValue[], // better name?
    replacementRow?: readonly ColumnValue[],
    depth: number,
  }): Database {
    if (spec.mode === "update" && spec.replacementRow === undefined) {
      throw new Error(`Replacement Row missing on update`);
    }

    const compiledFk = spec.childRowReference.foreignKey;

    const action =
      spec.mode === "delete"
        ? compiledFk.fk.onDelete
        : compiledFk.fk.onUpdate;

    const childTable = this.requireTableById(spec.childRowReference.childTableId);
    const childRow = childTable.requireRow(spec.childRowReference.childRowNum);
    
    let updatedChildRow: ColumnValue[] | undefined;

    const requiresRowRewrite =
      (action === ReferentialAction.cascade && spec.mode === "update") ||
      action === ReferentialAction.setNull;

    if (requiresRowRewrite) {
      // updatedChildRow = this.applyReferentialActionToRow(
      //   childRow,
      //   spec.replacementRow!,
      //   compiledFk.projectChildValues,
      //   action,
      // )
      updatedChildRow = compiledFk.applyReferentialActionToRow(
        childRow,
        spec.replacementRow!,
        action,
      )
      
      // No-op where child row wouldn't be impacted
      const requiresMutation = !arraysEqual(
        spec.oldRow, // should this be childRow, not oldRow? TODO, change and test
        // I think old Row is actually the parent?
        // and why should parent === child?
        updatedChildRow,
      ); 

      if (!requiresMutation) return this;
    }
    
    switch (action) {
      case ReferentialAction.restrict:
        throw new Error(`Child Table references Parent Row`);

      case ReferentialAction.noAction:
        return this;

      case ReferentialAction.setNull:
        if (!updatedChildRow) throw new Error(`Missing child row updates`);

        return this.tryUpdateRow(
          spec.childRowReference.childTableId,
          spec.childRowReference.childRowNum,
          updatedChildRow, //nullUpdates,
          spec.depth + 1,
        );

      case ReferentialAction.cascade:
        if (spec.mode === "delete") {
          return this.tryRemoveRow(
            spec.childRowReference.childTableId,
            spec.childRowReference.childRowNum,
            spec.depth + 1,
          );
        } else {
          if (!updatedChildRow) throw new Error(`Missing child row updates`);

          return this.tryUpdateRow(
            spec.childRowReference.childTableId,
            spec.childRowReference.childRowNum,
            updatedChildRow,
            spec.depth + 1,
          );
        }

      default:
        throw new Error(`No Referential Action specified for foreign key.`);
    }
  }

  public convertUpdatesForChildRowReference(
    foreignKey: ForeignKey,
    childTableName: string,
    parentRowUpdates: Map<number, ColumnValue>,
  ): Map<number, ColumnValue> {
    const childReferenceUpdates = new Map<number, ColumnValue>();

    const parentTable = this.requireTableById(foreignKey.parentTable);
    const parentColumns = foreignKey.parentColumns.map(parentTable.requireColumnById);

    const parentColumnIdToParentColumnIndex = new Map<ColumnId, number>();
    parentColumns.forEach(column => {
      if (
        !foreignKey.parentColumns.includes(column.id)
      ) return;
      parentColumnIdToParentColumnIndex.set(
        column.id,
        column.position
      )
    });

    const childColumnIdToParentColumnId = new Map<ColumnId, ColumnId>();
    for (let i = 0; i < foreignKey.columns.length; i++) {
      childColumnIdToParentColumnId.set(
        foreignKey.columns[i],
        foreignKey.parentColumns[i]
      );
    }
    
    const childTable = this.requireTable(childTableName);
    
    for (const childColumnId of foreignKey.columns) {
      const childColumn = childTable.requireColumnById(childColumnId);
      const childColumnIndex = childColumn.position;
      const parentColumnId = childColumnIdToParentColumnId.get(childColumnId);
      if (!parentColumnId) throw new Error(`No corresponding parentColumn`);
      const parentColumnIndex = parentColumnIdToParentColumnIndex.get(parentColumnId);
      if (parentColumnIndex === undefined) throw new Error(`No corresponding parentColumnIndex`);
      if (!parentRowUpdates.has(parentColumnIndex)) continue; // no update to cascade
      const updateValue = parentRowUpdates.get(parentColumnIndex);
      if (updateValue === undefined) throw new Error(`No corresponding update value`);
      childReferenceUpdates.set(childColumnIndex, updateValue);
    }

    return childReferenceUpdates;
  }

  private tryRemoveRow(
    tableId: TableId,
    rowNum: number,
    depth: number
  ): Database {
    if (depth >= MAX_DEPTH) {
      throw new Error(`Reached max recursion depth ${MAX_DEPTH}`);
    }

    const table: Table = this.requireTableById(tableId);

    if (!table.isRowAlive(rowNum)) return this;

    const removedRow = table.requireRowView(rowNum);

    const tableWithRowRemoved = table.removeRow(rowNum);

    const dbWithRowRemoved: Database = this.updateTable(tableWithRowRemoved);

    let updatedDatabase = dbWithRowRemoved;
    
    let dbWithReferenceUpdated;

    const compiledFks = new Map<ForeignKey, CompiledForeignKey>();

    while (true) {
      const childRowReferences = updatedDatabase.findImpactedChildRowReferences(
        //tableName,
        tableWithRowRemoved.id, // TODO, q: why not  just pass the table?
        removedRow,
      );

      let mutation = false;
      for (const childRowReference of childRowReferences) {
        if (
          //normalizeIdentifier(tableName) ===
          //normalizeIdentifier(childRowReference.childTableId) &&
          tableId === childRowReference.childTableId &&
          rowNum === childRowReference.childRowNum
        ) {
          continue;
        }

        const fk = childRowReference.foreignKey;
        let compiledFk = compiledFks.get(fk);

        //if compiled fk not yet found in structure,
        if (!compiledFk) {
          // compile the referenced fk and store it in the map
          const childReferenceTable = this.requireTableById(childRowReference.childTableId);
          compiledFk = new CompiledForeignKey(
            fk,
            fk.columns.map(c => childReferenceTable.requireColumnById(c).position),
            fk.parentColumns.map(pc => table.requireColumnById(pc).position),
          );
          compiledFks.set(fk, compiledFk);

        }
        // create a compiled child row reference object

        const compiledChildRowReference = {
          ...childRowReference,
          foreignKey: compiledFk,
        }

        dbWithReferenceUpdated = updatedDatabase.tryApplyReferentialAction({
          childRowReference: compiledChildRowReference,
          oldRow: removedRow.values,
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

    const updatedDatabase = this.tryRemoveRow(table.id, rowNum, 0);

    updatedDatabase.assertAllForeignKeysValid();

    return updatedDatabase;
  }

  public updateRow(
    tableName: string,
    rowNum: number,
    replacementRow: ColumnValue[],
  ): Database {
    const table: Table = this.requireTable(tableName); 

    table.assertRowAlive(rowNum);

    const updatedDatabase = this.tryUpdateRow(table.id, rowNum, replacementRow, 0);

    updatedDatabase.assertAllForeignKeysValid();

    return updatedDatabase;
  }

  private tryUpdateRow(
    tableId: TableId,
    rowNum: number,
    replacementRow: ColumnValue[],
    depth: number,
  ): Database {
    if (depth >= MAX_DEPTH) {
      throw new Error(`Reached max recursion depth ${MAX_DEPTH}`);
    }

    const table: Table = this.requireTableById(tableId);

    if (!table.isRowAlive(rowNum)) return this;

    const existingRow: RowView = table.requireRowView(rowNum);

    const tableWithRowUpdated = table.updateRow(replacementRow, rowNum);

    const dbWithRowUpdated: Database = this.updateTable(tableWithRowUpdated);

    let updatedDatabase = dbWithRowUpdated;
    let dbWithReferenceUpdated;

    //create structure of compiled foreign keys
    const compiledFks = new Map<ForeignKey, CompiledForeignKey>();

    while (true) {

      const childRowReferences = updatedDatabase.findImpactedChildRowReferences(
        //tableName,
        tableWithRowUpdated.id, // TODO: q: why not just pass the table? 
        existingRow,
      );

      let mutation = false;

      for (const childRowReference of childRowReferences) {
        if (
          //normalizeIdentifier(tableName) ===
          //normalizeIdentifier(childRowReference.childTableName) &&
          tableId === childRowReference.childTableId &&
          rowNum === childRowReference.childRowNum
        ) {
          continue;
        }

        const fk = childRowReference.foreignKey;
        let compiledFk = compiledFks.get(fk);

        //if compiled fk not yet found in structure,
        if (!compiledFk) {
          // compile the referenced fk and store it in the map
          const childReferenceTable = this.requireTableById(childRowReference.childTableId);
          compiledFk = new CompiledForeignKey(
            fk,
            childReferenceTable.requireIndexById(fk.reverseIndex).columnIndexes,
            //fk.columns.map(c => childReferenceTable.requireColumnById(c).position),
            //fk.parentColumns.map(pc => table.requireColumnById(pc).position),
            table.requireIndexById(fk.parentIndex).columnIndexes,
          );
          compiledFks.set(fk, compiledFk);

        }
        // create a compiled child row reference object

        const compiledChildRowReference = {
          ...childRowReference,
          foreignKey: compiledFk,
        }

        dbWithReferenceUpdated = updatedDatabase.tryApplyReferentialAction({
          //childRowReference, // send the compiled reference here instead of non-compiled
          childRowReference: compiledChildRowReference,
          mode: "update",
          oldRow: existingRow.values,
          replacementRow,
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
      const childIndex = childTable.requireIndexById(fk.reverseIndex);
      const projected = childIndex.projectValues(row);

      if (projected.includes(null)) return;

      const latestParentTable =
        //fk.parentTable === normalizeIdentifier(childTable.name) ?
        fk.parentTable === childTable.id ?
        childTable :
        this.requireTableById(fk.parentTable);

      const parentIndex = latestParentTable.requireIndexById(fk.parentIndex);

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

  // public renameColumn(
  //   tableName: string,
  //   oldColumnName: string,
  //   newColumnName: string,
  // ): Database {
  //   const normalizedName = normalizeIdentifier(newColumnName);

  //   if (normalizeIdentifier(oldColumnName) === normalizedName) return this;

  //   const tablesWithUpdatedFkReferences = this.tables.mapValues(t => 
  //     t.tryRenameForeignKeyParentColumn(
  //       tableName,
  //       oldColumnName,
  //       newColumnName,
  //     )
  //   );

  //   const tableWithRenamedColumn = tablesWithUpdatedFkReferences
  //     .require(normalizeIdentifier(tableName))
  //     .renameColumn(oldColumnName, newColumnName);

  //   const updatedTables = tablesWithUpdatedFkReferences
  //    .update(normalizeIdentifier(tableName), tableWithRenamedColumn);

  //   return this.with({
  //     tables: updatedTables,
  //   } as Partial<this>);
  // }

  public removeColumn(
    tableName: string,
    columnName: string,
  ): Database {
    const table = this.requireTable(tableName);

    const columnId = table.requireColumnIdByName(columnName);

    this.assertNoForeignKeyReferencesAny(table.id, [columnId])

    const updatedTable = table.removeColumnById(columnId);

    return this.updateTable(updatedTable);
    //uh oh, remove column doesn't update positions columnIndexes for each foreign key that references the table.
  }

  public removeIndex(tableName: string, indexName: string): Database {
    const table = this.requireTable(tableName);

    const index = table.requireIndex(indexName);

    for (const childTable of this.tables.values()) {
      for(const fk of childTable.foreignKeys.values()) {
        if (
          fk.parentTable === table.id
          //fk.parentTable === normalizeIdentifier(tableName)
        ) {
          const fkParentIndex = table.requireIndexById(fk.parentIndex);
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

    const updatedTable = this.requireTable(tableName)
      .renameIndex(oldName, newName);

    return this.updateTable(updatedTable);

    // let updatedTables = this.tables;

    // const normalizedOldName = normalizeIdentifier(oldName);
    // const normalizedNewName = normalizeIdentifier(newName);

    // this.tables.forEach(table => {
    //   const latestTable =
    //     normalizeIdentifier(table.name) ===
    //     normalizeIdentifier(tableWithRenamedIndex.name) ?
    //     tableWithRenamedIndex :
    //     table;

    //   let updatedTable = latestTable;
    //   latestTable.foreignKeys.forEach(fk => {
    //     if (fk.parentIndex === normalizedOldName) {
    //       const updatedFk = fk.withParentIndex(normalizedNewName);
    //       updatedTable = updatedTable.updateForeignKey(updatedFk);
    //     }
    //   });

    //   if (table !== updatedTable) {
    //     updatedTables
    //       .remove(normalizedOldName)
    //       .add(normalizedNewName, updatedTable);
    //   }
    // });

    // return this.with({
    //   tables: updatedTables,
    // } as Partial<this>);
  }
}

function arraysEqual(a: readonly any[], b: readonly any[]): boolean {
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