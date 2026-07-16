import { Table, type TableId } from './Table.js';
import { normalizeIdentifier } from '../utils/normalizeIdentifier.js';
import { type Column, type ColumnId } from './Column.js';
import { isTypeCompatible } from "../types/ColumnType.js";
import { type ColumnValue } from "../types/ColumnValue.js";
import { 
  CompiledForeignKey,
  type ForeignKey,
} from './ForeignKey.js';
import { Immutable } from "../infrastructure/Immutable.js";
import { type ReferentialAction } from './ReferentialAction.js';
import { type RowView } from './RowView.js';
import { IdAllocator } from '../types/IdAllocator.js';
import { NamedObjectStore } from '../infrastructure/NamedObjectStore.js';
import { type ResolvedUpdate } from '../types/ResolvedUpdate.js';
import { type ResolvedDelete } from '../types/ResolvedDelete.js';
import { arraysEqual } from '../utils/arrayHelpers.js';

const MAX_DEPTH = 25;

export type DatabaseId = number & { readonly __brand: "DatabaseId" };

export class Database extends Immutable {
  public readonly id: DatabaseId;
  public readonly name: string;

  public readonly tables: NamedObjectStore<Table, TableId>;
  public readonly tableIds: IdAllocator<TableId>;

  constructor(spec: {
    id: DatabaseId,
    name: string,
  }) {
    super();

    this.id = spec.id;
    this.name = spec.name;

    this.tables = new NamedObjectStore();
    this.tableIds = new IdAllocator();

    this.validate();
    this.seal();
  }

  public validate() {}

  public static create(spec: {
    name: string,
    id: DatabaseId,
  }): Database {
    return new Database(spec);
  }

  public addTable(table: Table): this {
    return this.with({
      tables: this.tables.add(table),
    } as Partial<this>);
  }

  public updateTable(table: Table): this {
    return this.with({
      tables: this.tables.update(table),
    } as Partial<this>);
  }

  public createTable(spec: { name: string }): this {
    this.tables.assertNameUnused(spec.name);

    const [id, tableIds] = this.tableIds.allocate();

    const table = Table.create({...spec, id});

    const updatedTables = this.tables.add(table);

    return this.with({
      tables: updatedTables,
      tableIds,
    } as Partial<this>);
  }

  public removeTable(name: string): Database {
    return this.removeTableById(this.tables.requireIdByName(name));
  }

  public removeTableById(id: TableId): Database {
    for (const table of this.tables.values()) {
      table.assertTableUnreferenced(id);
    }

    const table = this.tables.require(id);

    const updatedTables = this.tables.remove(id);

    return this.with({
      tables: updatedTables,
    } as Partial<this>);
  }

  public renameTable(name: string, newName: string): Database {
    return this.renameTableById(
      this.tables.requireIdByName(name),
      newName
    );
  }
  
  public renameTableById(id: TableId, newName: string): Database {
    const table = this.tables.require(id);

    const oldName = table.name;

    if (oldName === newName) return this;

    const normalizedOldName = normalizeIdentifier(oldName);
    const normalizedNewName = normalizeIdentifier(newName);

    if (normalizedOldName !== normalizedNewName) {
      this.assertTableNameUnused(newName);
    }

    const renamedTable = table.rename(newName);

    const updatedTables = this.tables.update(renamedTable);

    return this.with({
      tables: updatedTables,
    } as Partial<this>);
  }

  private assertTableNameUnused(name: string): void {
    if (this.tables.hasName(name)) {
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
    const childTable = this.tables.requireByName(tableName);

    const childColumnIds = spec.columns.map(c => childTable.columns.requireIdByName(c));
    const childColumns = childColumnIds.map(c => childTable.columns.require(c));

    const reverseIndex = childTable.indexes.requireByName(spec.reverseIndex);

    const parentTable = this.tables.requireByName(spec.parentTable);

    const parentColumnIds = spec.parentColumns.map(c => parentTable.columns.requireIdByName(c));
    const parentColumns = parentColumnIds.map(c => parentTable.columns.require(c));

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

    const foreignKey = updatedChildTable.foreignKeys.requireByName(spec.name);

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
      .tables.require(foreignKey.parentTable)
      .indexes.require(foreignKey.parentIndex);

    const reverseIndex = childTable
      .indexes.require(foreignKey.reverseIndex);

    for(const row of childTable.iterateAliveRows()) {
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

    for (const table of this.tables.values()) {
      for (const fk of table.foreignKeys.values()) {
        if (
          fk.parentTable === tableId &&
          fk.parentColumns.some(col => target.has(col))
        ) {
          throw new Error(
            `Foreign key '${fk.name}' in table '${table.name}' references column(s) being modified'`
          );
        }
      }
    }
  }

  //Used in Database::removeIndex(), not yet written, but may be used by a foreignKey // TODO
  public assertNoForeignKeyReferencesExact(
    tableId: TableId,
    columnNames: string[]
  ): void {
    for (const table of this.tables.values()) {
      for (const fk of table.foreignKeys.values()) {
        if (
          fk.parentTable === tableId &&
          arraysEqual(fk.parentColumns, columnNames)
        ) {
          throw new Error(
            `Foreign key '${fk.name}' in table '${table.name}' references columns being modified'`
          );
        }
      }
    }
  }

  public addRow(tableName: string, row: ColumnValue[]): Database {
    const table: Table = this.tables.requireByName(tableName);

    const updatedTable = table.addRow(row);

    this.validateChildRowAgainstForeignKeys(row, updatedTable);

    return this.updateTable(updatedTable);
  }

  private findImpactedChildRowReferences(
    parentTableId: TableId,
    parentRow: RowView,
  ): Array<{
    foreignKey: ForeignKey,
    childTableId: TableId,
    childRowNum: number,
  }> {
    const childRowReferences = [];

    const parentTable = this.tables.require(parentTableId);

    for (const table of this.tables.values()) {

      for (const foreignKey of table.foreignKeys.values()) {
        if (foreignKey.parentTable !== parentTable.id) continue;

        const reverseIndex = table.indexes.require(foreignKey.reverseIndex);

        const parentIndex = parentTable.indexes.require(foreignKey.parentIndex);
        const projection = parentIndex.projectValues(parentRow.values);

        const currentRows = reverseIndex.getRowNumsFromProjection(projection);

        if (!currentRows?.length) continue;
        for (const childRowNum of currentRows) {

          // No-op when no impact to parent projection
          if (parentTable.isRowAlive(parentRow.index)) {
            const replacementRow = parentTable.requireRow(parentRow.index);
            const replacementRowProjection =
              parentIndex.projectValues(replacementRow);

            if (arraysEqual(projection, replacementRowProjection)) continue;
          }

          childRowReferences.push({
            foreignKey,
            childTableId: table.id,
            childRowNum,
          });
        }
      }
    }

    return childRowReferences;
  }

  // private tryApplyReferentialAction(spec: {
  //   childRowReference: {
  //     foreignKey: CompiledForeignKey,
  //     childTableId: TableId,
  //     childRowNum: number,
  //   },
  //   mode: "update" | "delete",
  //   oldRow: readonly ColumnValue[], // better name?
  //   replacementRow?: readonly ColumnValue[],
  //   depth: number,
  // }): Database {
  //   if (spec.mode === "update" && spec.replacementRow === undefined) {
  //     throw new Error(`Replacement Row missing on update`);
  //   }

  //   const compiledFk = spec.childRowReference.foreignKey;

  //   const action =
  //     spec.mode === "delete"
  //       ? compiledFk.fk.onDelete
  //       : compiledFk.fk.onUpdate;

  //   const childTable = this.tables.require(spec.childRowReference.childTableId);
  //   const childRow = childTable.requireRow(spec.childRowReference.childRowNum);
    
  //   let updatedChildRow: ColumnValue[] | undefined;

  //   const requiresRowRewrite =
  //     (action === ReferentialAction.cascade && spec.mode === "update") ||
  //     action === ReferentialAction.setNull;

  //   if (requiresRowRewrite) {
  //     updatedChildRow = compiledFk.applyReferentialActionToRow(
  //       childRow,
  //       spec.replacementRow!,
  //       action,
  //     )
      
  //     // No-op where child row wouldn't be impacted
  //     const requiresMutation = !arraysEqual(
  //       spec.oldRow, // should this be childRow, not oldRow? TODO, change and test
  //       // I think old Row is actually the parent?
  //       // and why should parent === child?
  //       updatedChildRow,
  //     ); 

  //     // if (arraysEqual(childRow, updatedChildRow)) {
  //     //   return undefined;
  //     // }

  //     if (!requiresMutation) return this;
  //   }
    
  //   switch (action) {
  //     case ReferentialAction.restrict:
  //       throw new Error(`Child Table references Parent Row`);

  //     case ReferentialAction.noAction:
  //       return this;

  //     case ReferentialAction.setNull:
  //       if (!updatedChildRow) throw new Error(`Missing child row updates`);

  //       return this.tryUpdateRow(
  //         spec.childRowReference.childTableId,
  //         spec.childRowReference.childRowNum,
  //         updatedChildRow, //nullUpdates,
  //         spec.depth + 1,
  //       );

  //     case ReferentialAction.cascade:
  //       if (spec.mode === "delete") {
  //         return this.tryRemoveRow(
  //           spec.childRowReference.childTableId,
  //           spec.childRowReference.childRowNum,
  //           spec.depth + 1,
  //         );
  //       } else {
  //         if (!updatedChildRow) throw new Error(`Missing child row updates`);

  //         return this.tryUpdateRow(
  //           spec.childRowReference.childTableId,
  //           spec.childRowReference.childRowNum,
  //           updatedChildRow,
  //           spec.depth + 1,
  //         );
  //       }

  //     default:
  //       throw new Error(`No Referential Action specified for foreign key.`);
  //   }
  // }

  // public convertUpdatesForChildRowReference(
  //   foreignKey: ForeignKey,
  //   childTableName: string,
  //   parentRowUpdates: Map<number, ColumnValue>,
  // ): Map<number, ColumnValue> {
  //   const childReferenceUpdates = new Map<number, ColumnValue>();

  //   const parentTable = this.tables.require(foreignKey.parentTable);
  //   const parentColumns = foreignKey.parentColumns.map(parentTable.columns.require);

  //   const parentColumnIdToParentColumnIndex = new Map<ColumnId, number>();
  //   parentColumns.forEach(column => {
  //     if (
  //       !foreignKey.parentColumns.includes(column.id)
  //     ) return;
  //     parentColumnIdToParentColumnIndex.set(
  //       column.id,
  //       column.position
  //     )
  //   });

  //   const childColumnIdToParentColumnId = new Map<ColumnId, ColumnId>();
  //   for (let i = 0; i < foreignKey.columns.length; i++) {
  //     childColumnIdToParentColumnId.set(
  //       foreignKey.columns[i],
  //       foreignKey.parentColumns[i]
  //     );
  //   }
    
  //   const childTable = this.tables.requireByName(childTableName);
    
  //   for (const childColumnId of foreignKey.columns) {
  //     const childColumn = childTable.columns.require(childColumnId);
  //     const childColumnIndex = childColumn.position;
  //     const parentColumnId = childColumnIdToParentColumnId.get(childColumnId);
  //     if (!parentColumnId) throw new Error(`No corresponding parentColumn`);
  //     const parentColumnIndex = parentColumnIdToParentColumnIndex.get(parentColumnId);
  //     if (parentColumnIndex === undefined) throw new Error(`No corresponding parentColumnIndex`);
  //     if (!parentRowUpdates.has(parentColumnIndex)) continue; // no update to cascade
  //     const updateValue = parentRowUpdates.get(parentColumnIndex);
  //     if (updateValue === undefined) throw new Error(`No corresponding update value`);
  //     childReferenceUpdates.set(childColumnIndex, updateValue);
  //   }

  //   return childReferenceUpdates;
  // }

  // private tryRemoveRow(
  //   tableId: TableId,
  //   rowNum: number,
  //   depth: number
  // ): Database {
  //   if (depth >= MAX_DEPTH) {
  //     throw new Error(`Reached max recursion depth ${MAX_DEPTH}`);
  //   }

  //   const table: Table = this.tables.require(tableId);

  //   if (!table.isRowAlive(rowNum)) return this;

  //   const removedRow = table.requireRowView(rowNum);

  //   const tableWithRowRemoved = table.removeRow(rowNum);

  //   const dbWithRowRemoved: Database = this.updateTable(tableWithRowRemoved);

  //   let updatedDatabase = dbWithRowRemoved;
    
  //   let dbWithReferenceUpdated;

  //   const compiledFks = new Map<ForeignKey, CompiledForeignKey>();

  //   while (true) {
  //     const childRowReferences = updatedDatabase.findImpactedChildRowReferences(
  //       //tableName,
  //       tableWithRowRemoved.id, // TODO, q: why not  just pass the table?
  //       removedRow,
  //     );

  //     let mutation = false;
  //     for (const childRowReference of childRowReferences) {
  //       if (
  //         //normalizeIdentifier(tableName) ===
  //         //normalizeIdentifier(childRowReference.childTableId) &&
  //         tableId === childRowReference.childTableId &&
  //         rowNum === childRowReference.childRowNum
  //       ) {
  //         continue;
  //       }

  //       const fk = childRowReference.foreignKey;
  //       let compiledFk = compiledFks.get(fk);

  //       //if compiled fk not yet found in structure,
  //       if (!compiledFk) {
  //         // compile the referenced fk and store it in the map
  //         const childReferenceTable = this.tables.require(childRowReference.childTableId);
  //         compiledFk = new CompiledForeignKey(
  //           fk,
  //           fk.columns.map(c => childReferenceTable.columns.require(c).position),
  //           fk.parentColumns.map(pc => table.columns.require(pc).position),
  //         );
  //         compiledFks.set(fk, compiledFk);

  //       }
  //       // create a compiled child row reference object

  //       const compiledChildRowReference = {
  //         ...childRowReference,
  //         foreignKey: compiledFk,
  //       }

  //       dbWithReferenceUpdated = updatedDatabase.tryApplyReferentialAction({
  //         childRowReference: compiledChildRowReference,
  //         oldRow: removedRow.values,
  //         mode: "delete",
  //         depth,
  //       });

  //       if (dbWithReferenceUpdated === updatedDatabase) continue;
        
  //       mutation = true;
  //       break;
  //     }

  //     if (dbWithReferenceUpdated && mutation) {
  //       updatedDatabase = dbWithReferenceUpdated;
  //     } else {
  //       break;
  //     }
  //   }

  //   return updatedDatabase;
  // }

  // public removeRow(tableName: string, rowNum: number): Database {
  //   const table: Table = this.tables.requireByName(tableName); 

  //   table.assertRowAlive(rowNum);

  //   const updatedDatabase = this.tryRemoveRow(table.id, rowNum, 0);

  //   updatedDatabase.assertAllForeignKeysValid();

  //   return updatedDatabase;
  // }

  // public updateRow(
  //   tableName: string,
  //   rowNum: number,
  //   replacementRow: ColumnValue[],
  // ): Database {
  //   const table: Table = this.tables.requireByName(tableName); 

  //   table.assertRowAlive(rowNum);

  //   const updatedDatabase = this.tryUpdateRow(table.id, rowNum, replacementRow, 0);

  //   updatedDatabase.assertAllForeignKeysValid();

  //   return updatedDatabase;
  // }

  public removeRows(
    tableName: string,
    deletes: ResolvedDelete[],
  ): Database {
    const tableId = this.tables.requireIdByName(tableName);

    let updatedDatabase =
      this.applyResolvedDeletes(
        tableId,
        deletes,
      );

    updatedDatabase =
      updatedDatabase.applyReferentialDeletes(
        tableId,
        deletes,
      );

    updatedDatabase.assertAllForeignKeysValid();

    return updatedDatabase;
  }

  public updateRows(
    tableName: string,
    updates: ResolvedUpdate[],
  ): Database {
    const tableId = this.tables.requireIdByName(tableName); 

    let updatedDatabase =
      this.applyResolvedUpdates(
        tableId,
        updates,
      );

    updatedDatabase =
      updatedDatabase.applyReferentialUpdates(
        tableId,
        updates,
      );

    updatedDatabase.assertAllForeignKeysValid();

    return updatedDatabase;
  }

  private applyResolvedDeletes(
    tableId: TableId,
    deletes: ResolvedDelete[],
  ): Database {
    if (deletes.length === 0) {
      return this;
    }

    const table: Table = this.tables.require(tableId);

    let updatedTable =
      table.removeRows(deletes);

    return this.updateTable(updatedTable);
  }

  private applyResolvedUpdates(
    tableId: TableId,
    updates: ResolvedUpdate[],
  ): Database {
    if (updates.length === 0) {
      return this;
    }
    
    const table: Table = this.tables.require(tableId); 

    let updatedTable =
      table.updateRows(updates);

    return this.updateTable(updatedTable);
  }

  private applyReferentialUpdates(
    tableId: TableId,
    updates: ResolvedUpdate[],
  ): Database {
    let db: Database = this;

    const table = this.tables.require(tableId);

    const childUpdatesByTable =
        new Map<TableId, ResolvedUpdate[]>();

    const compiledFks = new Map<ForeignKey, CompiledForeignKey>();

    for (const update of updates) {

      const oldRowView: RowView = {
        index: update.rowNum,
        values: update.oldRow,
      };

        const refs =
            db.findImpactedChildRowReferences(
                tableId,
                oldRowView,
            );

        for (const ref of refs) {

          const fk = ref.foreignKey
          let compiledFk = compiledFks.get(fk);

          if (!compiledFk) {
            const childReferenceTable = db.tables.require(ref.childTableId);
            compiledFk = new CompiledForeignKey(
              fk,
              childReferenceTable.indexes.require(fk.reverseIndex).columnIndexes,
              table.indexes.require(fk.parentIndex).columnIndexes,
            );
            compiledFks.set(fk, compiledFk);
          }

          const compiledChildRowReference = {
            ...ref,
            foreignKey: compiledFk,
          }

          const childMutation =
            db.resolveReferentialUpdateAction(
                compiledChildRowReference,
                update.newRow,
            );

          if (!childMutation) continue;

          let tableUpdates =
            childUpdatesByTable.get(ref.childTableId);

          if (!tableUpdates) {
            tableUpdates = [];
            childUpdatesByTable.set(
              ref.childTableId,
              tableUpdates,
            );
          }

          tableUpdates.push(childMutation);
        }
    }

    for (const [childTableId, childUpdates] of childUpdatesByTable) {

        db = db.applyResolvedUpdates(
            childTableId,
            childUpdates,
        );

        db = db.applyReferentialUpdates(
            childTableId,
            childUpdates,
        );
    }

    return db;
  }

  private applyReferentialDeletes(
    tableId: TableId,
    deletes: ResolvedDelete[],
  ): Database {
    let db: Database = this;

    const table = this.tables.require(tableId);

    const childDeletesByTable =
      new Map<TableId, ResolvedDelete[]>();

    const childUpdatesByTable =
      new Map<TableId, ResolvedUpdate[]>();

    const compiledFks = new Map<ForeignKey, CompiledForeignKey>();

    for (const deleteRow of deletes) {

      const oldRowView: RowView = {
        index: deleteRow.rowNum,
        values: deleteRow.oldRow,
      };

        const refs =
            db.findImpactedChildRowReferences(
                tableId,
                //deleteRow.tableId,
                oldRowView,
            );

        for (const ref of refs) {

          const fk = ref.foreignKey
          let compiledFk = compiledFks.get(fk);

          if (!compiledFk) {
            const childReferenceTable = db.tables.require(ref.childTableId);
            compiledFk = new CompiledForeignKey(
              fk,
              childReferenceTable.indexes.require(fk.reverseIndex).columnIndexes,
              table.indexes.require(fk.parentIndex).columnIndexes,
            );
            compiledFks.set(fk, compiledFk);
          }

          const compiledChildRowReference = {
            ...ref,
            foreignKey: compiledFk,
          }

          const childMutation =
            db.resolveReferentialDeleteAction(
                compiledChildRowReference,
            );

          if (!childMutation) continue;

          if ("newRow" in childMutation) {
            let tableUpdates =
              childUpdatesByTable.get(ref.childTableId);

            if (!tableUpdates) {
              tableUpdates = [];
              childUpdatesByTable.set(
                ref.childTableId,
                tableUpdates,
              );
            }

            tableUpdates.push(childMutation);
          } else {
            let tableDeletes =
              childDeletesByTable.get(ref.childTableId);

            if (!tableDeletes) {
              tableDeletes = [];
              childDeletesByTable.set(
                ref.childTableId,
                tableDeletes,
              );
            }

            tableDeletes.push(childMutation);
          }
        }
    }

    for (const [tableId, deletes] of childDeletesByTable) {
      db = db.applyResolvedDeletes(tableId, deletes);

      db = db.applyReferentialDeletes(
        tableId,
        deletes,
      );
    }

    for (const [tableId, updates] of childUpdatesByTable) {
      db = db.applyResolvedUpdates(tableId, updates);

      db = db.applyReferentialUpdates(
        tableId,
        updates,
      );
    }

    return db;
  }

  private resolveReferentialUpdateAction(
    compiledChildRowReference: {
      foreignKey: CompiledForeignKey,
      childTableId: TableId,
      childRowNum: number,
    },
    newParentRow: readonly ColumnValue[],
  ): ResolvedUpdate | undefined {
    const fk = compiledChildRowReference.foreignKey.fk;

    const childTable =
      this.tables.require(compiledChildRowReference.childTableId);

    const childRow =
      childTable.requireRow(compiledChildRowReference.childRowNum);

    switch (fk.onUpdate) {
      case "noAction":
        return undefined;

      case "restrict":
        throw new Error(
          `Child Table references Parent Row`
        );

      case "setNull": {
        const updatedChildRow =
          compiledChildRowReference.foreignKey.applyReferentialActionToRow(
            childRow,
            newParentRow,
            "setNull",
          );

        if (arraysEqual(childRow, updatedChildRow)) {
          return undefined;
        }

        return {
          rowNum: compiledChildRowReference.childRowNum,
          oldRow: childRow,
          newRow: updatedChildRow,
        };
      }

      case "cascade": {
        const updatedChildRow =
          compiledChildRowReference.foreignKey.applyReferentialActionToRow(
            childRow,
            newParentRow,
            "cascade",
          );

        if (arraysEqual(childRow, updatedChildRow)) {
          return undefined;
        }

        return {
          rowNum: compiledChildRowReference.childRowNum,
          oldRow: childRow,
          newRow: updatedChildRow,
        };
      }

      default:
        throw new Error(
          `Unsupported referential action`
        );
    }
  }

  private resolveReferentialDeleteAction(
    compiledChildRowReference: {
      foreignKey: CompiledForeignKey,
      childTableId: TableId,
      childRowNum: number,
    }
  ): ResolvedUpdate | ResolvedDelete | undefined {
    const fk = compiledChildRowReference.foreignKey.fk;

    const childTable =
      this.tables.require(compiledChildRowReference.childTableId);

    const childRow =
      childTable.requireRow(compiledChildRowReference.childRowNum);

    switch (fk.onDelete) {
      case "noAction":
        return undefined;

      case "restrict":
        throw new Error(
          `Child Table references Parent Row`
        );

      case "setNull": {
        const updatedChildRow =
          compiledChildRowReference.foreignKey.applyReferentialActionToRow(
            childRow,
            undefined,
            "setNull",
          );

        if (arraysEqual(childRow, updatedChildRow)) {
          return undefined;
        }

        return {
          rowNum: compiledChildRowReference.childRowNum,
          oldRow: childRow,
          newRow: updatedChildRow,
        };
      }

      case "cascade": {
        return {
          rowNum: compiledChildRowReference.childRowNum,
          oldRow: childRow,
        };
      }

      default:
        throw new Error(
          `Unsupported referential action`
        );
    }
  }

  // private tryUpdateRow(
  //   tableId: TableId,
  //   rowNum: number,
  //   replacementRow: ColumnValue[],
  //   depth: number,
  // ): Database {
  //   if (depth >= MAX_DEPTH) {
  //     throw new Error(`Reached max recursion depth ${MAX_DEPTH}`);
  //   }

  //   const table: Table = this.tables.require(tableId);

  //   if (!table.isRowAlive(rowNum)) return this;

  //   const existingRow: RowView = table.requireRowView(rowNum);

  //   const tableWithRowUpdated = table.updateRow(replacementRow, rowNum);

  //   const dbWithRowUpdated: Database = this.updateTable(tableWithRowUpdated);

  //   let updatedDatabase = dbWithRowUpdated;
  //   let dbWithReferenceUpdated;

  //   const compiledFks = new Map<ForeignKey, CompiledForeignKey>();

  //   while (true) {

  //     const childRowReferences = updatedDatabase.findImpactedChildRowReferences(
  //       tableWithRowUpdated.id, // TODO: q: why not just pass the table? 
  //       existingRow,
  //     );

  //     let mutation = false;

  //     for (const childRowReference of childRowReferences) {
  //       if (
  //         tableId === childRowReference.childTableId &&
  //         rowNum === childRowReference.childRowNum
  //       ) {
  //         continue;
  //       }

  //       const fk = childRowReference.foreignKey;
  //       let compiledFk = compiledFks.get(fk);

  //       if (!compiledFk) {
  //         const childReferenceTable = this.tables.require(childRowReference.childTableId);
  //         compiledFk = new CompiledForeignKey(
  //           fk,
  //           childReferenceTable.indexes.require(fk.reverseIndex).columnIndexes,
  //           table.indexes.require(fk.parentIndex).columnIndexes,
  //         );
  //         compiledFks.set(fk, compiledFk);

  //       }
  //       // create a compiled child row reference object

  //       const compiledChildRowReference = {
  //         ...childRowReference,
  //         foreignKey: compiledFk,
  //       }

  //       dbWithReferenceUpdated = updatedDatabase.tryApplyReferentialAction({
  //         childRowReference: compiledChildRowReference,
  //         mode: "update",
  //         oldRow: existingRow.values,
  //         replacementRow,
  //         depth,
  //       });

  //       if (dbWithReferenceUpdated === updatedDatabase) continue;
        
  //       mutation = true;
  //       break;
  //     }

  //     if (dbWithReferenceUpdated && mutation) {
  //       updatedDatabase = dbWithReferenceUpdated;
  //     } else {
  //       break;
  //     }
  //   }

  //   return updatedDatabase;
  // }

  private validateChildRowAgainstForeignKeys(row: ColumnValue[], childTable: Table): void {
     for (const fk of childTable.foreignKeys.values()) {
      const childIndex = childTable.indexes.require(fk.reverseIndex);
      const projected = childIndex.projectValues(row);

      if (projected.includes(null)) return;

      const latestParentTable =
        //fk.parentTable === normalizeIdentifier(childTable.name) ?
        fk.parentTable === childTable.id ?
        childTable :
        this.tables.require(fk.parentTable);

      const parentIndex = latestParentTable.indexes.require(fk.parentIndex);

      if (!parentIndex.hasProjectedValues(projected)) {
        throw new Error(
          `FK violation: (${fk.columns.join(",")}) ->
          ${fk.parentTable}(${fk.parentColumns.join(",")})`
        );
      }
    }
  }

  private assertAllForeignKeysValid(): void {
    for (const table of this.tables.values()) {
      for (const fk of table.foreignKeys.values()) {
        this.assertExistingRowsSatisfyForeignKey(table, fk);
      }
    }
  }

  public removeColumn(
    tableName: string,
    columnName: string,
  ): Database {
    const table = this.tables.requireByName(tableName);

    const columnId = table.columns.requireIdByName(columnName);

    this.assertNoForeignKeyReferencesAny(table.id, [columnId])

    const updatedTable = table.removeColumnById(columnId);

    return this.updateTable(updatedTable);
  }

  public removeIndex(tableName: string, indexName: string): Database {
    const table = this.tables.requireByName(tableName);

    const index = table.indexes.requireByName(indexName);

    for (const childTable of this.tables.values()) {
      for(const fk of childTable.foreignKeys.values()) {
        if (
          fk.parentTable === table.id
          //fk.parentTable === normalizeIdentifier(tableName)
        ) {
          const fkParentIndex = table.indexes.require(fk.parentIndex);
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

}

// export function arraysEqual(a: readonly any[], b: readonly any[]): boolean {
//   if (a.length !== b.length) return false;

//   for (let i = 0; i < a.length; i++) {
//     if (a[i] !== b[i]) return false;
//   }

//   return true;
// }

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