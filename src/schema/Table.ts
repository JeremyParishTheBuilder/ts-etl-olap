import {
  type ColumnSpec,
  type ColumnValue,
  type ColumnType,
  Column,
  assertTypeIndexable,
  type ColumnId,
} from "./Column.js";
import { PrimaryKey } from "./PrimaryKey.js";
import { ForeignKey, getReverseIndexFromName, type ForeignKeyId } from "./ForeignKey.js";
import { Check, type CheckId } from "./Check.js";
import {
  Index,
  type IndexId,
  type IndexSpec,
  requiresIndexRebuild,
} from "./Index.js";
import { Immutable } from "../infrastructure/Immutable.js";
import { ColumnBoundImmutable } from "./ColumnBoundImmutable.js";
import { PersistentMap } from "../infrastructure/PersistentMap.js";
import { type RowView } from "./RowView.js";
import { normalizeIdentifier } from "../utils/normalizeIdentifier.js";
import { CheckSpec, ForeignKeySpec, PrimaryKeySpec } from "./Constraint.js";
import { ReferentialAction } from "./ReferentialAction.js";
import { type ExplicitInput } from "../types/ExplicitInput.js";
import { IdAllocator, IdService } from "../types/IdAllocator.js";
import { Predicate } from "../query/predicate/Predicate.js";


export class Table extends Immutable {
  public columns: PersistentMap<ColumnId, Column> = new PersistentMap();
  public columnNames: PersistentMap<string, ColumnId> = new PersistentMap();
  public columnPositions: PersistentMap<number, ColumnId> = new PersistentMap();

  public primaryKey: PrimaryKey | undefined;

  public indexes: PersistentMap<IndexId, Index> = new PersistentMap();
  public indexNames: PersistentMap<string, IndexId> = new PersistentMap();

  public foreignKeys: PersistentMap<ForeignKeyId, ForeignKey> = new PersistentMap();
  public foreignKeyNames: PersistentMap<string, ForeignKeyId> = new PersistentMap();

  public checks: PersistentMap<CheckId, Check> = new PersistentMap();
  public checkNames: PersistentMap<string, CheckId> = new PersistentMap();

  public rowAlive: boolean[] = [];
  public numRows: number = 0;

  public readonly columnIds = new IdAllocator<ColumnId>();
  public readonly indexIds = new IdAllocator<IndexId>();
  public readonly foreignKeyIds = new IdAllocator<ForeignKeyId>();
  public readonly checkIds = new IdAllocator<CheckId>();
  
  public validate(): void {}

  constructor(public name: string) {
    super();
    this.validate();
    this.seal();
  }

  public rename(newName: string): Table {
    return this.with({
      name: newName
    } as Partial<this>);
  }

  //  <columns>
  public getColumnIdByName(name: string): ColumnId | undefined {
    const columnId = this.columnNames.get(normalizeIdentifier(name));
    return columnId;
  }

  public requireColumnIdByName(name: string): ColumnId {
    const columnId = this.getColumnIdByName(name);
    if (!columnId) {
      throw new Error(`Column Name: "${name}" not found`);
    }
    return columnId;
  }

  public getColumn(name: string): Column | undefined {
    const columnId = this.getColumnIdByName(name);
    if (!columnId) return undefined;
    return this.columns.get(columnId);
  }

  public requireColumn(name: string): Column {
    const column = this.getColumn(name);
    if (!column) {
      throw new Error(`Column: ${name} not found`);
    }
    return column;
  }

  public getColumnById(id: ColumnId): Column | undefined {
    return this.columns.get(id);
  }

  public requireColumnById(id: ColumnId): Column {
    const column = this.getColumnById(id);
    if (!column) {
      throw new Error(`Column Id: ${id} not found`);
    }
    return column;
  }

  public getColumnPosition(id: ColumnId): number | undefined {
    return this.columnPositions.get(id);
  }

  public requireColumnPosition(id: ColumnId): number {
    const position = this.getColumnPosition(id);
    if (!position) {
      throw new Error(`Position for Column: ${id} not found`);
    }
    return position;
  }

  // public requireColumns(columnNames: string[]): Column[] {
  //   const columns: Column[] = [];
  //   columnNames.forEach((columnName: string) => {
  //     columns.push(this.requireColumn(columnName));
  //   });
  //   return columns;
  // }

  public requireColumns(columnNames: string[]): Column[] {
    return columnNames.map(c => this.requireColumn(c));
  }

  private assertColumnNameUnused(name: string): void {
    const id = this.getColumnIdByName(name);
    if (id) {
      throw new Error(`Column name ${name} is already used by Id: ${id}`);
    }
  }

  public createColumn(spec: ColumnSpec): Table {
    this.assertColumnNameUnused(spec.name);

    if (
      spec.nullable === false &&
      spec.defaultValue === undefined &&
      this.numRows > 0
    ) {
      throw new Error(
        `New non-nullable column ${spec.name} unable to backfill without a default value`
      );
    }

    const [id, columnIds] = this.columnIds.allocate();

    const position = this.columns.map.size;

    const column = Column.create({...spec, id, position});

    // TODO: later, consider the need to backfill its data[] with values 

    const updatedColumns = this.columns.add(id, column);

    const updatedColumnNames = this.columnNames.add(
      normalizeIdentifier(spec.name),
      id
    );

    const updatedColumnPositions = this.columnPositions.add(position, id);

    return this.with({
      columns: updatedColumns,
      columnNames: updatedColumnNames,
      columnPositions: updatedColumnPositions,
      columnIds,
    } as Partial<this>);
  }

  public removeColumn(name: string): Table {
    return this.removeColumnById(this.requireColumnIdByName(name));
  }

  public removeColumnById(id: ColumnId): Table {
    const column = this.requireColumnById(id);

    this.assertColumnUnreferenced(id);

    const updatedColumns = this.columns
      .mapValues(c => c.tryDecrementPosition(column.position))
      .remove(id);
    
    const updatedColumnNames = this.columnNames.remove(
      normalizeIdentifier(column.name)
    );

    const updatedColumnPositions = new PersistentMap<number, ColumnId>();
    const columnIdToPositionMap = new Map<ColumnId, number>();
    updatedColumns.forEach(column => {
      columnIdToPositionMap.set(column.id, column.position);
      updatedColumnPositions.add(column.position, column.id);
    });


    const updatedIndexes = this.indexes.mapValues(c => 
      c.tryUpdateColumnIndexes(columnIdToPositionMap)
    );

    return this.with({
      columns: updatedColumns,
      columnNames: updatedColumnNames,
      columnPositions: updatedColumnPositions,
      indexes: updatedIndexes,
    } as Partial<this>);
  }

  public renameColumn(name: string, newName: string): Table {
    return this.renameColumnById(
      this.requireColumnIdByName(name),
      newName
    );
  }

  public renameColumnById(id: ColumnId, newName: string): Table {
    const column = this.requireColumnById(id);

    const oldName = column.name;

    if (oldName === newName) return this;

    const normalizedOldName = normalizeIdentifier(oldName);
    const normalizedNewName = normalizeIdentifier(newName);

    if (normalizedOldName !== normalizedNewName) {
      this.assertColumnNameUnused(newName);
    }

    const renamedColumn = column.rename(newName);

    const updatedColumns = this.columns.update(id, renamedColumn);

    const updateColumnNames = this.columnNames
      .remove(normalizedOldName)
      .add(normalizedNewName, id);

    return this.with({
      columns: updatedColumns,
      columnNames: updateColumnNames,
    } as Partial<this>);
  }

  public alterColumn(name: string, newType: ColumnType): Table {
    return this.alterColumnById(
      this.requireColumnIdByName(name),
      newType
    );
  }

  public alterColumnById(id: ColumnId, newType: ColumnType): Table {
    const column = this.requireColumnById(id);

    if (column.type === newType) return this;
    
    if (this.indexes.some(i => i.referencesColumn(id))) {
      assertTypeIndexable(newType);
    }

    if (this.foreignKeys.some(c => c.referencesColumn(id))) {
      throw new Error(`Cannot alter column: ${column.name}, referenced by foreignKeys.`);
    }

    const updatedChecks = this.checks.mapValues(c => c.tryAlterColumn(id, newType));

    const updatedColumns = this.columns.update(
      id,
      column.alter(newType)
    );

    const tableWithUpdatedColumns = this.with({
      columns: updatedColumns,
    } as Partial<this>);

    let updatedIndexes = this.indexes;
    if (requiresIndexRebuild(column.type, newType)) {
      updatedIndexes = this.indexes.mapValues(index =>
        index.referencesColumn(id)
          ? index.build(tableWithUpdatedColumns.iterateAliveRows())
          : index
      );
    }

    return tableWithUpdatedColumns.with({
      checks: updatedChecks,
      indexes: updatedIndexes,
    } as Partial<this>);
  }
  //  </columns>

  //  <constraints>
  private assertNoDuplicateUniqueColumnSet(columns: ColumnId[]): void {
    this.indexes.forEach(index => {
      if (index.unique && sameColumnSet(index.columns, columns)) {
        throw new Error(
          `Unique constraint on columns [${columns.join(", ")}] already exists`
        );
      }
    });
  }

  public createPrimaryKey(spec: {
    name: string,
    index: string,
  }): Table {
    const indexId = this.requireIndexIdByName(spec.index);
    return this.createPrimaryKeyById({name: spec.name, index: indexId});
  }

  public createPrimaryKeyById(spec: {
    name: string,
    index: IndexId,
  }): Table {
    if (this.primaryKey) {
      throw new Error(`Primary Key ${this.primaryKey} already exists`);
    }

    const index = this.requireIndexById(spec.index);

    if (index.unique !== true) {
      throw new Error(`Referenced PrimaryKey index is not unique`);
    }
    
    index.columns.map(c => this.requireColumnById(c)).forEach(column => {
      if(column.nullable !== false) {
        throw new Error(`Column ${column.name} must be 'not nullable'.`);
      }
    });

    const sharesBackingIndexName =
      normalizeIdentifier(spec.name) === normalizeIdentifier(index.name);

    if (!sharesBackingIndexName) {
      this.assertConstraintNameUnused(spec.name);
    }

    // if (!arraysEqual(pk.columns, index.columns)) {
    //   throw new Error(`Primary Key columns does not match index columns`);
    // }

    return this.with({
      primaryKey: PrimaryKey.create({
        ...spec
      }),
    } as Partial<this>);
  }

  // public createPrimaryKey(spec: {
  //   name: string,
  //   //columns: ColumnId[],
  //   index: string//IndexId
  // }): Table {
  //   if (this.primaryKey) {
  //     throw new Error(`Primary Key ${this.primaryKey} already exists`);
  //   }

  //   const index = this.requireIndex(spec.index);

  //   //TODO, assert that index columns match?
  //   // does index have to exist beforehand?

  //   if (!index.unique) {
  //     throw new Error(`Referenced PrimaryKey index is not unique`);
  //   }

  //   const sharesBackingIndexName =
  //     normalizeIdentifier(index.name) === normalizeIdentifier(spec.name);
  //   if (!sharesBackingIndexName) {
  //     this.assertConstraintNameUnused(spec.name);
  //   }

  //   const primaryKey = PrimaryKey.create({
  //     ...spec,
  //     columns: index.columns,
  //     index: index.name,
  //   });

  //   // this.requireColumns(primaryKey.columns).forEach(column => {
  //   //   if(column.nullable !== false) {
  //   //     throw new Error(`Column ${column.name} must be 'not nullable'.`);
  //   //   }
  //   // });

  //   //const index = this.requireIndex(primaryKey.index);

    

  //   // if (!arraysEqual(primaryKey.columns, index.columns)) {
  //   //   throw new Error(`Primary Key columns does not match index columns`);
  //   // }

  //   return this.with({
  //     primaryKey,
  //   } as Partial<this>);
  // }

  public removePrimaryKey(): Table {
    const pk = this.requirePrimaryKey();

    // let indexes =
    //   this.indexes.has(pk.index) ?
    //   this.indexes.remove(pk.index) :
    //   this.indexes;

    return this.with({
      //indexes,
      primaryKey: undefined,
    } as Partial<this>);
  }

  public *iterateAliveRows(): IterableIterator<RowView> {
    for (let i = 0; i < this.numRows; i++) {
      const row = this.getRowView(i);

      if (!row) continue;

      yield row;
    }
  }

  public getForeignKey(name: string): ForeignKey | undefined {
    const id = this.getForeignKeyIdByName(name);
    if (!id) return undefined;
    return this.getForeignKeyById(id);
  }

  public requireForeignKey(name: string): ForeignKey {
    const foreignKey = this.getForeignKey(name);
    if (!foreignKey) {
      throw new Error(`ForeignKey: ${name} not found`);
    }
    return foreignKey;
  }

  public getForeignKeyById(id: ForeignKeyId): ForeignKey | undefined {
    return this.foreignKeys.get(id);
  }

  public requireForeignKeyById(id: ForeignKeyId): ForeignKey {
    const foreignKey = this.getForeignKeyById(id);
    if (!foreignKey) {
      throw new Error(`ForeignKey Id: ${id} not found`);
    }
    return foreignKey;
  }

  public getForeignKeyIdByName(name: string): ForeignKeyId | undefined {
    const foreignKeyId = this.foreignKeyNames.get(normalizeIdentifier(name));
    console.log("foreignKeyId");
    console.log(this.foreignKeyNames);
    return foreignKeyId;
  }

  public requireForeignKeyIdByName(name: string): ForeignKeyId {
    const foreignKeyId = this.getForeignKeyIdByName(name);
    if (!foreignKeyId) {
      throw new Error(`ForeignKey Name: "${name}" not found`);
    }
    return foreignKeyId;
  }

  public createForeignKey(
    spec: {
      name: string,
      columns: ColumnId[],
      reverseIndex: IndexId,
      parentTable: string, // TableId
      parentColumns: ColumnId[],
      //parentColumnIndexes: number[],
      parentIndex: IndexId,
      onDelete?: ReferentialAction,
      onUpdate?: ReferentialAction,
    }
  ): Table {
    this.assertConstraintNameUnused(spec.name);

    // const columnIndexes = spec.columns
    //   .map(this.requireColumnById)
    //   .map(c => c.position);

    const [id, foreignKeyIds] = this.foreignKeyIds.allocate();

    //const fkReverseIndexName = getReverseIndexFromName(spec.name);

    //this.assertIndexNameUnused(fkReverseIndexName);

    //const [fkReverseIndexId, indexIds] = this.indexIds.allocate();

    // const fkReverseIndex = Index.create({
    //   id: fkReverseIndexId,
    //   name: fkReverseIndexName,
    //   columns: spec.columns,
    //   columnIndexes: columnIndexes,
    //   unique: false,
    // }).build(this.iterateAliveRows());

    // const updatedIndexes = this.indexes.add(
    //   fkReverseIndexId,
    //   fkReverseIndex
    // );

    const foreignKey = ForeignKey.create({
      ...spec,
      id,
      //columnIndexes,
      //reverseIndex: fkReverseIndexId,
    });

    const updatedForeignKeys = this.foreignKeys.add(
      id,
      foreignKey
    );

    const updatedForeignKeyNames = this.foreignKeyNames.add(
      normalizeIdentifier(spec.name),
      id
    );


    return this.with({
      foreignKeys: updatedForeignKeys,
      foreignKeyNames: updatedForeignKeyNames,
      foreignKeyIds,
      //indexes: updatedIndexes,
      //indexIds,
    } as Partial<this>);
  }

  public removeForeignKey(name: string): Table {
    return this.removeForeignKeyById(this.requireForeignKeyIdByName(name));
  }

  public removeForeignKeyById(id: ForeignKeyId): Table {
    const fk = this.requireForeignKeyById(id);

    return this.with({
      foreignKeys: this.foreignKeys.remove(id),
      indexes: this.indexes.remove(fk.reverseIndex),
    } as Partial<this>);
  }
  
  //might not be needed anymore
  // public updateForeignKey(fk: ForeignKey): Table {
  //   return this.with({
  //     foreignKeys: this.foreignKeys
  //       .remove(normalizeIdentifier(fk.name))
  //       .add(normalizeIdentifier(fk.name), fk),
  //   } as Partial<this>);
  // }

  public getCheck(name: string): Check | undefined {
    const id = this.getCheckIdByName(name);
    if (!id) return undefined;
    return this.getCheckById(id);
  }

  public requireCheck(name: string): Check {
    const check = this.getCheck(name);
    console.log(this.checkNames); // DELETE
    if (!check) {
      throw new Error(`Check: ${name} not found`);
    }
    return check;
  }

  public getCheckById(id: CheckId): Check | undefined {
    return this.checks.get(id);
  }

  public requireCheckById(id: CheckId): Check {
    const check = this.getCheckById(id);
    if (!check) {
      throw new Error(`Check Id: ${id} not found`);
    }
    return check;
  }

  public getCheckIdByName(name: string): CheckId | undefined {
    const checkId = this.checkNames.get(normalizeIdentifier(name));
    return checkId;
  }

  public requireCheckIdByName(name: string): CheckId {
    const checkId = this.getCheckIdByName(name);
    if (!checkId) {
      throw new Error(`Check Name: "${name}" not found`);
    }
    return checkId;
  }

  public createCheck(spec: Omit<CheckSpec, "kind">): Table {
    this.assertConstraintNameUnused(spec.name);

    const columnIds = spec.columns.map(c => this.requireColumnIdByName(c));

    const [id, checkIds] = this.checkIds.allocate();

    const check = Check.create({
      ...spec,
      id,
      columns: columnIds,
    });

    const updatedChecks = this.checks.add(id, check);

    const updatedCheckNames = this.checkNames.add(
      normalizeIdentifier(spec.name),
      id
    );

    console.log(updatedCheckNames); // DELETE

    return this.with({
      checks: updatedChecks,
      checkNames: updatedCheckNames,
      checkIds,
    } as Partial<this>);
  }

  

  // public updateCheck(check: Check): this {
  //   return this.with({
  //     checks: this.checks.update(normalizeIdentifier(check.name), check),
  //   } as Partial<this>);
  // }

  // public assertColumnNameUnreferenced(name: string) {
  //   if (
  //     this.primaryKey?.referencesColumn(name) ||
  //     this.foreignKeys.some(c => c.referencesColumn(name)) ||
  //     this.checks.some(c => c.referencesColumn(name)) ||
  //     this.indexes.some(i => i.referencesColumn(name))
  //   ) {
  //     throw new Error(`Column name: ${name} is referenced by some Constraint or Index`);
  //   }
  // }

  private assertColumnUnreferenced(id: ColumnId) {
    if (
      //might be removing columns from primarykey...
      //this.primaryKey?.referencesColumn(id) || // TODO: update referencesColumn to take ID instead of name
      this.foreignKeys.some(c => c.referencesColumn(id)) ||
      this.indexes.some(i => i.referencesColumn(id)) ||
      this.checks.some(c => c.referencesColumn(id))
    ) {
      throw new Error(`Column Id: ${id} is referenced by some Constraint or Index`);
    }
  }


  public getPrimaryKey(): PrimaryKey | undefined {
    return this.primaryKey;
  }

  public requirePrimaryKey(): PrimaryKey {
    const primaryKey = this.primaryKey;
    if (!primaryKey) {
      throw new Error(`No Primary Key exists.`);
    }
    return primaryKey;
  }

  public renamePrimaryKey(newName: string): Table {
    const primaryKey = this.requirePrimaryKey();

    const oldName = primaryKey.name;

    if (oldName === newName) return this;

    const normalizedNewName = normalizeIdentifier(newName);
    const normalizedOldName = normalizeIdentifier(oldName);

    // if (normalizedOldName !== normalizedNewName) {
    //   this.assertConstraintNameUnused(newName);
    // }

    const backingIndexName = this.requireIndexById(primaryKey.index).name;

    const sharesBackingIndexName = normalizedNewName === backingIndexName;
    const existingConstraint = this.getConstraintByName(newName);
    if (
      !sharesBackingIndexName &&
      existingConstraint &&
      existingConstraint !== primaryKey
    ) {
      throw new Error(`Existing constraint already using name: ${newName}`);
    }

    const renamedPrimaryKey = primaryKey.rename(newName);

    return this.with({
      primaryKey: renamedPrimaryKey,
    } as Partial<this>);
  }

  public renameForeignKey(oldName: string, newName: string): Table {
    return this.renameForeignKeyById(
      this.requireForeignKeyIdByName(oldName),
      newName,
    );
  }

  public renameForeignKeyById(id: ForeignKeyId, newName: string): Table {
    const foreignKey = this.requireForeignKeyById(id);

    const oldName = foreignKey.name;

    if (oldName === newName) return this;

    const normalizedOldName = normalizeIdentifier(oldName);
    const normalizedNewName = normalizeIdentifier(newName);

    if (normalizedOldName !== normalizedNewName) {
      this.assertConstraintNameUnused(newName);
    }

    const renamedForeignKey = foreignKey.rename(newName);    

    const updatedForeignKeys = this.foreignKeys.update(
      id,
      renamedForeignKey
    );

    const updatedForeignKeyNames =
      this.foreignKeyNames
        .remove(normalizedOldName)
        .add(normalizedNewName, id);

    // TODO, do we want foreignKey renames to also rename the index?
    // probably not? would have to update indexs as well.

    // const newIndexName = getReverseIndexFromName(newName);

    // let updatedIndexes = this.indexes;

    // if (newIndexName !== foreignKey.reverseIndex) {
    //   this.assertIndexNameUnused(newIndexName);

    //   const index = this.requireIndex(fk.reverseIndex);

    //   const renamedIndex = index.rename(newIndexName);

    //   const updatedIndex = renamedIndex.withOwnerConstraint(newName);

    //   updatedIndexes = updatedIndexes
    //     .remove(fk.reverseIndex)
    //     .add(newIndexName, updatedIndex);
    // }

    return this.with({
      foreignKeys: updatedForeignKeys,
      foreignKeyNames: updatedForeignKeyNames,
      //indexes: updatedIndexes,
    } as Partial<this>);
  }

  public getConstraintByName(name: string): ColumnBoundImmutable | PrimaryKey | undefined {
    const normalizedName = normalizeIdentifier(name);

    if (
      this.primaryKey &&
      normalizeIdentifier(this.primaryKey.name) === normalizedName
    ) {
      return this.requirePrimaryKey();
    } else if (
      this.indexNames.has(normalizedName) &&
      this.requireIndex(name).unique
    ) {
      return this.requireIndex(name);
    } else if (this.foreignKeyNames.has(normalizedName)) {
      return this.requireForeignKey(name);
    } else if (this.checkNames.has(normalizedName)) {
      return this.requireCheck(name);
    } else { return undefined; }
  }

  public requireConstraintByName(name: string): ColumnBoundImmutable | PrimaryKey {
    const constraint = this.getConstraintByName(name);
    if (!constraint) {
      throw new Error(`No constraint named: ${name}`);
    }
    return constraint;
  }

  private assertConstraintNameUnused(name: string): void {
    if (this.getConstraintByName(name)) {
      throw new Error(`Constraint name: ${name} already used`);
    }
  }

  public assertTableNameUnreferenced(name: string): void {
    this.foreignKeys.forEach(fk => {
      if (fk.parentTable === normalizeIdentifier(name)) {
        throw new Error(`Foreign Key ${fk.name} references table ${name}`);
      }}
    );
  }

  public getIndex(name: string): Index | undefined {
    const id = this.getIndexIdByName(name);
    if (!id) return undefined;
    return this.getIndexById(id);
  }

  public requireIndex(name: string): Index {
    const index = this.getIndex(name);
    if (!index) {
      throw new Error(`Index: ${name} not found`);
    }
    return index;
  }

  public getIndexById(id: IndexId): Index | undefined {
    return this.indexes.get(id);
  }

  public requireIndexById(id: IndexId): Index {
    const index = this.getIndexById(id);
    if (!index) {
      throw new Error(`Index Id: ${id} not found`);
    }
    return index;
  }

  public getIndexIdByName(name: string): IndexId | undefined {
    const indexId = this.indexNames.get(normalizeIdentifier(name));
    return indexId;
  }

  public requireIndexIdByName(name: string): IndexId {
    const indexId = this.getIndexIdByName(name);
    if (!indexId) {
      throw new Error(`Index Name: "${name}" not found`);
    }
    return indexId;
  }

  public createIndex(spec: IndexSpec & {internal?: boolean}): Table {
    const columnIds = spec.columns.map(c => this.requireColumnIdByName(c)); 

    if (spec.unique) {
      this.assertConstraintNameUnused(spec.name);
      this.assertNoDuplicateUniqueColumnSet(columnIds);
    }

    const columnIndexes =
      columnIds
        .map(c => this.requireColumnById(c))
        .map(c => c.position);

    const [id, indexIds] = this.indexIds.allocate();

    const index = Index
      .create({...spec, id, columns: columnIds, columnIndexes})
      .build(this.iterateAliveRows());

    const updatedIndexes = this.indexes.add(id, index);

    //let updatedIndexNames = this.indexNames;
    //if (!spec.internal) {
      this.assertIndexNameUnused(spec.name);
      const updatedIndexNames = this.indexNames.add(
        normalizeIdentifier(spec.name),
        id
      );
    //}

    return this.with({
      indexes: updatedIndexes,
      indexNames: updatedIndexNames,
      indexIds,
    } as Partial<this>);
  }

  public removeIndex(name: string): Table {
    return this.removeIndexById(this.requireIndexIdByName(name));
  }

  public removeIndexById(id: IndexId): Table {
    const index = this.requireIndexById(id);

    if (id === this.primaryKey?.index) {
      throw new Error(`Cannot remove index when referenced by Primary Key`);
    }

    if (Array.from(this.foreignKeys.values()).some(f => f.reverseIndex === id)) {
      throw new Error(`Cannot remove index when referenced by Foreign Key`);
    }

    // if (index.ownerConstraint) {
    //   throw new Error(`Cannot remove index owned by a constraint`);
    // }

    const updatedIndexes = this.indexes.remove(id);

    const updatedIndexNames = this.indexNames.remove(
      normalizeIdentifier(index.name)
    );

    return this.with({
      indexes: updatedIndexes,
      indexNames: updatedIndexNames,
    } as Partial<this>);
  }

  public removeCheck(name: string): Table {
    return this.removeCheckById(this.requireCheckIdByName(name));
  }

  public removeCheckById(id: CheckId): Table {
    const check = this.requireCheckById(id);

    const updatedCheck = this.checks.remove(id);

    const updatedCheckNames = this.checkNames.remove(
      normalizeIdentifier(check.name)
    );

    return this.with({
      checks: updatedCheck,
      checkNames: updatedCheckNames,
    } as Partial<this>);
  }

  private assertIndexNameUnused(name: string): void {
    if (this.indexNames.has(normalizeIdentifier(name))) {
      throw new Error(`Index name ${name} is already used`);
    }
  }

  public renameIndex(name: string, newName: string): Table {
    return this.renameIndexById(
      this.requireIndexIdByName(name),
      newName
    );
  }

  public renameIndexById(id: IndexId, newName: string): Table {
    const index = this.requireIndexById(id);

    const oldName = index.name;

    if (oldName === newName) return this;

    const normalizedOldName = normalizeIdentifier(oldName);
    const normalizedNewName = normalizeIdentifier(newName);

    if (normalizedOldName !== normalizedNewName) {
      this.assertIndexNameUnused(newName);
      if (index.unique) {
        this.assertConstraintNameUnused(newName);
      }
    }

    // if (index.ownerConstraint) { // do we need this?
    //   throw new Error(`Cannot rename index owned by a constraint`);
    // }

    const renamedIndex = index.rename(newName);

    const updatedIndexes = this.indexes.update(id, renamedIndex);

    const updatedIndexNames = this.indexNames
      .remove(normalizedOldName)
      .add(normalizedNewName, id);

    return this.with({
      indexes: updatedIndexes,
      indexNames: updatedIndexNames,
    } as Partial<this>);
  }

  public renameCheck(name: string, newName: string): Table {
    return this.renameCheckById(
      this.requireCheckIdByName(name),
      newName
    );
  }

  public renameCheckById(id: CheckId, newName: string): Table {
    const check = this.requireCheckById(id);

    const oldName = check.name;

    if (oldName === newName) return this;

    const normalizedOldName = normalizeIdentifier(oldName);
    const normalizedNewName = normalizeIdentifier(newName);

    if (normalizedOldName !== normalizedNewName) {
      this.assertConstraintNameUnused(newName);
    }

    const renamedCheck = check.rename(newName);

    const updatedChecks = this.checks.update(id, renamedCheck);

    const updatedCheckNames = this.checkNames
      .remove(normalizedOldName)
      .add(normalizedNewName, id);    

    return this.with({
      checks: updatedChecks,
      checkNames: updatedCheckNames,
    } as Partial<this>);
  }

  public isRowAlive(rowNum: number): boolean {
    return (
      rowNum >= 0 &&
      rowNum < this.numRows &&
      this.rowAlive[rowNum] !== false
    );
  }

  public assertRowAlive(rowNum: number): void {
    if (!this.isRowAlive(rowNum)) {
      throw new Error(`Row ${rowNum} not alive`);
    }
  }

  public getRow(rowNum: number): ColumnValue[] | undefined {
    if (!this.isRowAlive(rowNum)) return undefined;

    const row: ColumnValue[] = [];
    for (const column of this.columns.values()) {
      const value = column.getDatumAtRow(rowNum);

      if (value === undefined) {
        return undefined;
      }

      row.push(value);
    }
    return row;
  }

  public requireRow(rowNum: number): ColumnValue[] {
    const row = this.getRow(rowNum);
    if (!row) {
      throw new Error(`Row Number ${rowNum} does not exist`);
    }
    return row;
  }

  public getRowView(rowNum: number): RowView | undefined {
    const values = this.getRow(rowNum);

    if (!values) return undefined;

    return {
      index: rowNum,
      values: values,
    };
  }

  public requireRowView(rowNum: number): RowView {
    const row = this.getRowView(rowNum);
    if (!row) {
      throw new Error(`Row Number ${rowNum} does not exist`);
    }
    return row;
  }
  //  </select>

  //  <insert/update>
  private assertRowLength(row: any[]): void {
    if (row.length !== this.columns.map.size) {
      throw new Error(`Resolved row length mismatch with table columns`);
    }
  }

  // public normalizeRow(row: ColumnValue[], mode: "insert" | "update"): ColumnValue[] {
  //   this.assertRowLength(row);

  //   const normalizedRow: ColumnValue[] = new Array(row.length);

  //   this.columns.forEach(column => {
  //     const i = column.position;

  //     normalizedRow[i] =
  //       column.normalizeDatum(row[i], mode);
  //   });

  //   return normalizedRow;
  // }

  // public resolveSemanticRow(
  //   semanticRow: SemanticValue[],
  //   mode: "insert" | "update",
  // ): ColumnValue[] {
  //   this.assertRowLength(semanticRow);
    
  //   const resolvedRow: ColumnValue[] = new Array(semanticRow.length);

  //   this.columns.forEach(column => {
  //     const i = column.position;

  //     resolvedRow[i] =
  //       column.resolveSemanticValue(semanticRow[i], mode);
  //   });

  //   return resolvedRow;
  // }

  public resolveInsertInputs(
    inputs: Map<string, ExplicitInput>,
  ): ColumnValue[] {
    const resolvedRow = new Array<ColumnValue>(this.columns.map.size);

    //for (const column of this.columnsByPosition()) {}
    this.columns.forEach(column => {
      const i = column.position;

      resolvedRow[i] =
        column.resolveInput(inputs.get(normalizeIdentifier(column.name)) ?? undefined, "insert");
    });

    return resolvedRow;
  }

  public resolveUpdateInputs(
    inputs: Map<ColumnId, ExplicitInput>,
    rowNum: number,
  ): ColumnValue[] {
    const existingRow = this.requireRow(rowNum);
    
    const resolvedRow = new Array<ColumnValue>(this.columns.map.size);

    this.columns.forEach(column => {
      const i = column.position; // TODO, replace with iteration of this.columnsByPosition

      const input = inputs.get(column.id);
      if (input === undefined) {
        resolvedRow[i] = existingRow[i];
        return;
      }

      resolvedRow[i] = column.resolveInput(input, "update");
    });

    return resolvedRow;
  }

  // public resolveUpdateRow(
  //   semanticRow: SemanticValue[],
  //   rowNum: number,
  // ): ColumnValue[] {
  //   this.assertRowLength(semanticRow);

  //   const existingRow = this.requireRow(rowNum);
    
  //   const resolvedRow: ColumnValue[] = new Array(semanticRow.length);

  //   this.columns.forEach(column => {
  //     const i = column.position;

  //     if (semanticRow[i].kind === "existing") {
  //       resolvedRow[i] = existingRow[i];
  //       return;
  //     }

  //     resolvedRow[i] = column.resolveSemanticValue(semanticRow[i], "update");
  //   });

  //   return resolvedRow;
  // }

  public addRow(row: ColumnValue[]): Table {
    this.assertRowLength(row);

    const rowView = {
      index: this.numRows,
      values: row,
    };

    this.assertRow(row); // CHECKs

    const updatedIndexes = this.indexes.mapValues(i => i.tryAddRow(rowView));
    //TODO, confirm whether it won't add a row with null when unique
    //Actually, it's ok to store keys will null even when unique
    // just that if there is a null, then it shan't be considered a unique constraint violation

    const updatedColumns = this.columns.mapValues(column =>
      column.addDatum(row[column.position])
    );

    // let updatedTable = this.with({
    //   columns: updatedColumns,
    //   numRows: this.numRows + 1,
    // } as Partial<this>);

    //updatedTable.assertRow();

    return this.with({
      indexes: updatedIndexes,
      columns: updatedColumns,
      numRows: this.numRows + 1,
    } as Partial<this>);
  }

  public updateRow(row: ColumnValue[], rowNum: number): Table {
    this.assertRowLength(row);

    const oldRow = this.requireRowView(rowNum);

    const newRow = {
      index: oldRow.index,
      values: row
    };

    this.assertRow(row);

    const updatedIndexes = this.indexes.mapValues(
      index => index.tryUpdateRow(oldRow, newRow)
    );


    const updatedColumns = this.columns.mapValues(column =>
      column.updateDatum(row[column.position], rowNum)
    );

    //this.assertRow(row);

    return this.with({
      indexes: updatedIndexes,
      columns: updatedColumns,
    } as Partial<this>);
  }

  public mergeRow(
    existingRow: readonly ColumnValue[],
    updates: Map<number, ColumnValue>,
  ): ColumnValue[] {
    const merged = [...existingRow];

    for (const [columnIndex, value] of updates) {
      if (columnIndex < 0 || columnIndex >= merged.length) {
        throw new Error(`Invalid column index ${columnIndex}`);
      }

      merged[columnIndex] = value;
    }

    return merged;
  }

  public removeRow(rowNum: number): Table {
    const row = this.requireRowView(rowNum);

    const updatedIndexes = this.indexes.mapValues(
      index => index.tryRemoveRow(row)
    );

    const updatedRowAlive = [...this.rowAlive];
    updatedRowAlive[rowNum] = false;

    return this.with({
      indexes: updatedIndexes,
      rowAlive: updatedRowAlive,
    } as Partial<this>);
  }

  public requireUniqueIndexByColumns(columns: ColumnId[]): Index {
    for (const index of this.indexes.values()) {
      if (
        index.unique &&
        arraysEqual(index.columns, columns)
      ) {
        return index;
      }
    }
    throw new Error(
      `No UNIQUE index found for columns [${columns.join(", ")}] in this exact order`
    );
  }

  private assertRow(row: ColumnValue[]) {
    for (const [name, check] of this.checks.map) {
      // evaluate the check expression in the context of the resolved row
      // assuming check.expr is a function (ResolvedRow, Table) => boolean
      if (false) {//!check.expr(row, this)) {
        throw new Error(`Check constraint '${name}' violated`);
      }
    }
  }

  // public tryRenameForeignKeyParentColumn(
  //   parentTableName: string,
  //   oldColumnName: string,
  //   newColumnName: string,
  // ): this {
  //   if (
  //     normalizeIdentifier(oldColumnName)
  //     === normalizeIdentifier(newColumnName)
  //   ) {
  //     return this;
  //   }

  //   return this.with({
  //     foreignKeys: this.foreignKeys.mapValues(fk =>
  //       fk.tryRenameParentColumn(parentTableName, oldColumnName, newColumnName)),
  //   } as Partial<this>);
  // }

  public tryRenameForeignKeyParentTable(
    oldParentTableName: string,
    newParentTableName: string,
  ): this {
    if (
      normalizeIdentifier(oldParentTableName)
      === normalizeIdentifier(newParentTableName)
    ) {
      return this;
    }

    return this.with({
      foreignKeys: this.foreignKeys.mapValues(fk =>
        fk.tryRenameParentTable(oldParentTableName, newParentTableName)),
    } as Partial<this>);
  }
}

//used for: findUniqueIndexByColumns() 
function arraysEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }

  return true;
}

//used for: addUnique()
function sameColumnSet(a: ColumnId[], b: ColumnId[]): boolean {
  if (a.length !== b.length) return false;

  const setA = new Set(a);
  for (const col of b) {
    if (!setA.has(col)) return false;
  }
  return true;
}