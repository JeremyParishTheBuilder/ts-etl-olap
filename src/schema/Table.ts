import {
  type ColumnSpec,
  type ColumnValue,
  type ColumnType,
  Column,
  assertTypeIndexable,
  type ColumnId,
} from "./Column.js";
import { PrimaryKey } from "./PrimaryKey.js";
import { ForeignKey, type ForeignKeyId } from "./ForeignKey.js";
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
import { CheckSpec } from "./Constraint.js";
import { ReferentialAction } from "./ReferentialAction.js";
import { type ExplicitInput } from "../types/ExplicitInput.js";
import { IdAllocator } from "../types/IdAllocator.js";
import { Predicate } from "../query/predicate/Predicate.js";
import { NamedObjectStore } from "../infrastructure/NamedObjectStore.js";

export type TableId = number & { readonly __brand: "TableId" };

export class Table extends Immutable {
  public id: TableId;
  public name: string;

  public columns: NamedObjectStore<Column, ColumnId>;
  public columnPositions: PersistentMap<number, ColumnId>;

  public primaryKey: PrimaryKey | undefined;
  public indexes: NamedObjectStore<Index, IndexId>;
  public foreignKeys: NamedObjectStore<ForeignKey, ForeignKeyId>;
  public checks: NamedObjectStore<Check, CheckId>;

  public rowAlive: boolean[];
  public numRows: number;

  public readonly columnIds;
  public readonly indexIds;
  public readonly foreignKeyIds;
  public readonly checkIds;
  
  public validate(): void {}

  constructor(spec: {
    id: TableId,
    name: string,
  }) {
    super();

    this.id = spec.id;
    this.name = spec.name;

    this.columns = new NamedObjectStore();
    this.columnPositions = new PersistentMap();

    this.primaryKey = undefined;
    this.indexes = new NamedObjectStore();
    this.foreignKeys = new NamedObjectStore();
    this.checks = new NamedObjectStore();

    this.rowAlive = [];
    this.numRows = 0;

    this.columnIds = new IdAllocator<ColumnId>();
    this.indexIds = new IdAllocator<IndexId>();
    this.foreignKeyIds = new IdAllocator<ForeignKeyId>();
    this.checkIds = new IdAllocator<CheckId>();

    this.validate();
    this.seal();
  }

  public static create(spec: {
    id: TableId,
    name: string,
  }): Table {
    return new Table(spec);
  }

  public rename(newName: string): Table {
    return this.with({
      name: newName
    } as Partial<this>);
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

  public createColumn(spec: ColumnSpec): Table {
    this.columns.assertNameUnused(spec.name);

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

    const position = this.columns.size();

    const column = Column.create({...spec, id, position});

    // TODO: later, consider the need to backfill its data[] with values
    //column.backfill();

    const updatedColumns = this.columns.add(column);

    const updatedColumnPositions = this.columnPositions.add(position, id);

    return this.with({
      columns: updatedColumns,
      columnPositions: updatedColumnPositions,
      columnIds,
    } as Partial<this>);
  }

  public removeColumn(name: string): Table {
    return this.removeColumnById(this.columns.requireIdByName(name));
  }

  public removeColumnById(id: ColumnId): Table {
    const column = this.columns.require(id);

    this.assertColumnUnreferenced(id);

    const updatedColumns = this.columns
      .mapValues(c => c.tryDecrementPosition(column.position))
      .remove(id);

    const updatedColumnPositions = new PersistentMap<number, ColumnId>();
    const columnIdToPositionMap = new Map<ColumnId, number>();
    for(const column of updatedColumns.values()) {
      columnIdToPositionMap.set(column.id, column.position);
      updatedColumnPositions.add(column.position, column.id);
    }

    const updatedIndexes = this.indexes.mapValues(c => 
      c.tryUpdateColumnIndexes(columnIdToPositionMap)
    );

    return this.with({
      columns: updatedColumns,
      columnPositions: updatedColumnPositions,
      indexes: updatedIndexes,
    } as Partial<this>);
  }

  public renameColumn(name: string, newName: string): Table {
    return this.renameColumnById(
      this.columns.requireIdByName(name),
      newName
    );
  }

  public renameColumnById(id: ColumnId, newName: string): Table {
    const column = this.columns.require(id);

    const oldName = column.name;

    if (oldName === newName) return this;

    const normalizedOldName = normalizeIdentifier(oldName);
    const normalizedNewName = normalizeIdentifier(newName);

    if (normalizedOldName !== normalizedNewName) {
      this.columns.assertNameUnused(newName);
    }

    const renamedColumn = column.rename(newName);

    const updatedColumns = this.columns.update(renamedColumn);

    return this.with({
      columns: updatedColumns,
    } as Partial<this>);
  }

  public alterColumn(name: string, newType: ColumnType): Table {
    return this.alterColumnById(
      this.columns.requireIdByName(name),
      newType
    );
  }

  public alterColumnById(id: ColumnId, newType: ColumnType): Table {
    const column = this.columns.require(id);

    if (column.type === newType) return this;
    
    if (this.indexes.some(i => i.referencesColumn(id))) {
      assertTypeIndexable(newType);
    }

    if (this.foreignKeys.some(fk => fk.referencesColumn(id))) {
      throw new Error(`Cannot alter column: ${column.name}, referenced by foreignKeys.`);
    }

    const updatedChecks = this.checks.mapValues(c => c.tryAlterColumn(id, newType));

    const updatedColumns = this.columns.update(
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
    for(const index of this.indexes.values()) {
      if (index.unique && sameColumnSet(index.columns, columns)) {
        throw new Error(
          `Unique constraint on columns [${columns.join(", ")}] already exists`
        );
      }
    }
  }

  public createPrimaryKey(spec: {
    name: string,
    index: string,
  }): Table {
    const indexId = this.indexes.requireIdByName(spec.index);
    return this.createPrimaryKeyById({name: spec.name, index: indexId});
  }

  public createPrimaryKeyById(spec: {
    name: string,
    index: IndexId,
  }): Table {
    if (this.primaryKey) {
      throw new Error(`Primary Key ${this.primaryKey} already exists`);
    }

    const index = this.indexes.require(spec.index);

    if (index.unique !== true) {
      throw new Error(`Referenced PrimaryKey index is not unique`);
    }
    
    index.columns.map(c => this.columns.require(c)).forEach(column => {
      if(column.nullable !== false) {
        throw new Error(`Column ${column.name} must be 'not nullable'.`);
      }
    });

    const sharesBackingIndexName =
      normalizeIdentifier(spec.name) === normalizeIdentifier(index.name);

    if (!sharesBackingIndexName) {
      this.assertConstraintNameUnused(spec.name);
    }

    return this.with({
      primaryKey: PrimaryKey.create({
        ...spec
      }),
    } as Partial<this>);
  }

  public removePrimaryKey(): Table {
    const pk = this.requirePrimaryKey();

    return this.with({
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

  public createForeignKey(
    spec: {
      name: string,
      columns: ColumnId[],
      reverseIndex: IndexId,
      parentTable: TableId,
      parentColumns: ColumnId[],
      parentIndex: IndexId,
      onDelete?: ReferentialAction,
      onUpdate?: ReferentialAction,
    }
  ): Table {
    this.assertConstraintNameUnused(spec.name);

    const [id, foreignKeyIds] = this.foreignKeyIds.allocate();
    
    const foreignKey = ForeignKey.create({
      ...spec,
      id,
    });

    const updatedForeignKeys = this.foreignKeys.add(foreignKey);

    return this.with({
      foreignKeys: updatedForeignKeys,
      foreignKeyIds,
    } as Partial<this>);
  }

  public removeForeignKey(name: string): Table {
    return this.removeForeignKeyById(this.foreignKeys.requireIdByName(name));
  }

  public removeForeignKeyById(id: ForeignKeyId): Table {
    const fk = this.foreignKeys.require(id);

    return this.with({
      foreignKeys: this.foreignKeys.remove(id),
      indexes: this.indexes.remove(fk.reverseIndex),
    } as Partial<this>);
  }

  public createCheck(spec: Omit<CheckSpec, "kind">): Table {
    this.assertConstraintNameUnused(spec.name);

    const columnIds = spec.columns.map(c => this.columns.requireIdByName(c));

    const [id, checkIds] = this.checkIds.allocate();

    const check = Check.create({
      ...spec,
      id,
      columns: columnIds,
    });

    const updatedChecks = this.checks.add(check);

    return this.with({
      checks: updatedChecks,
      checkIds,
    } as Partial<this>);
  }

  private assertColumnUnreferenced(id: ColumnId) {
    if (
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

    if (normalizedOldName !== normalizedNewName) {
      //this.assertConstraintNameUnused(newName);
    

      const backingIndexName = this.indexes.require(primaryKey.index).name;

      const sharesBackingIndexName =
        normalizedNewName === normalizeIdentifier(backingIndexName);

      const existingConstraint = this.getConstraintByName(newName);

      if (
        !sharesBackingIndexName &&
        existingConstraint //&&
        //existingConstraint !== primaryKey
      ) {
        throw new Error(`Existing constraint already using name: ${newName}`);
      }

    }

    const renamedPrimaryKey = primaryKey.rename(newName);

    return this.with({
      primaryKey: renamedPrimaryKey,
    } as Partial<this>);
  }

  public renameForeignKey(oldName: string, newName: string): Table {
    return this.renameForeignKeyById(
      this.foreignKeys.requireIdByName(oldName),
      newName,
    );
  }

  public renameForeignKeyById(id: ForeignKeyId, newName: string): Table {
    const foreignKey = this.foreignKeys.require(id);

    const oldName = foreignKey.name;

    if (oldName === newName) return this;

    const normalizedOldName = normalizeIdentifier(oldName);
    const normalizedNewName = normalizeIdentifier(newName);

    if (normalizedOldName !== normalizedNewName) {
      this.assertConstraintNameUnused(newName);
    }

    const renamedForeignKey = foreignKey.rename(newName);    

    const updatedForeignKeys = this.foreignKeys.update(renamedForeignKey);

    return this.with({
      foreignKeys: updatedForeignKeys,
    } as Partial<this>);
  }

  public getConstraintByName(name: string): ColumnBoundImmutable | PrimaryKey | undefined {
    if (
      this.primaryKey &&
      normalizeIdentifier(this.primaryKey.name) === normalizeIdentifier(name)
    ) {
      return this.requirePrimaryKey();
    } else if (
      this.indexes.hasName(name) &&
      this.indexes.getByName(name)?.unique
    ) {
      return this.indexes.requireByName(name);
    } else if (this.foreignKeys.hasName(name)) {
      return this.foreignKeys.requireByName(name);
    } else if (this.checks.hasName(name)) {
      return this.checks.requireByName(name);
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

  public assertTableUnreferenced(id: TableId): void {
    for (const fk of this.foreignKeys.values()) {
      if (fk.parentTable === id) {
        throw new Error(`Foreign Key ${fk.name} references table: ${id}`);
      }
    }
  }

  public createIndex(spec: IndexSpec & {internal?: boolean}): Table {
    this.assertIndexNameUnused(spec.name);

    const columnIds = spec.columns.map(c => this.columns.requireIdByName(c)); 

    if (spec.unique) {
      this.assertConstraintNameUnused(spec.name);
      this.assertNoDuplicateUniqueColumnSet(columnIds);
    }

    const columnIndexes =
      columnIds
        .map(c => this.columns.require(c))
        .map(c => c.position);

    const [id, indexIds] = this.indexIds.allocate();

    const index = Index
      .create({...spec, id, columns: columnIds, columnIndexes})
      .build(this.iterateAliveRows());

    const updatedIndexes = this.indexes.add(index);

    return this.with({
      indexes: updatedIndexes,
      indexIds,
    } as Partial<this>);
  }

  public removeIndex(name: string): Table {
    return this.removeIndexById(this.indexes.requireIdByName(name));
  }

  public removeIndexById(id: IndexId): Table {
    const index = this.indexes.require(id);

    if (id === this.primaryKey?.index) {
      throw new Error(`Cannot remove index when referenced by Primary Key`);
    }

    if (Array.from(this.foreignKeys.values()).some(f => f.reverseIndex === id)) {
      throw new Error(`Cannot remove index when referenced by Foreign Key`);
    }

    const updatedIndexes = this.indexes.remove(id);

    return this.with({
      indexes: updatedIndexes,
    } as Partial<this>);
  }

  public removeCheck(name: string): Table {
    return this.removeCheckById(this.checks.requireIdByName(name));
  }

  public removeCheckById(id: CheckId): Table {
    const check = this.checks.require(id);

    const updatedChecks = this.checks.remove(id);

    return this.with({
      checks: updatedChecks,
    } as Partial<this>);
  }

  private assertIndexNameUnused(name: string): void {
    if (this.indexes.hasName(name)) {
      throw new Error(`Index name ${name} is already used`);
    }
  }

  public renameIndex(name: string, newName: string): Table {
    return this.renameIndexById(
      this.indexes.requireIdByName(name),
      newName
    );
  }

  public renameIndexById(id: IndexId, newName: string): Table {
    const index = this.indexes.require(id);

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

    const renamedIndex = index.rename(newName);

    const updatedIndexes = this.indexes.update(renamedIndex);

    return this.with({
      indexes: updatedIndexes,
    } as Partial<this>);
  }

  public renameCheck(name: string, newName: string): Table {
    return this.renameCheckById(
      this.checks.requireIdByName(name),
      newName
    );
  }

  public renameCheckById(id: CheckId, newName: string): Table {
    const check = this.checks.require(id);

    const oldName = check.name;

    if (oldName === newName) return this;

    const normalizedOldName = normalizeIdentifier(oldName);
    const normalizedNewName = normalizeIdentifier(newName);

    if (normalizedOldName !== normalizedNewName) {
      this.assertConstraintNameUnused(newName);
    }

    const renamedCheck = check.rename(newName);

    const updatedChecks = this.checks.update(renamedCheck);

    return this.with({
      checks: updatedChecks,
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
    if (row.length !== this.columns.size()) {
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
    const resolvedRow = new Array<ColumnValue>(this.columns.size());

    //for (const column of this.columnsByPosition()) {}
    for(const column of this.columns.values()) {
      const i = column.position;

      resolvedRow[i] =
        column.resolveInput(inputs.get(normalizeIdentifier(column.name)) ?? undefined, "insert");
    }

    return resolvedRow;
  }

  public resolveUpdateInputs(
    inputs: Map<ColumnId, ExplicitInput>,
    rowNum: number,
  ): ColumnValue[] {
    const existingRow = this.requireRow(rowNum);
    
    const resolvedRow = new Array<ColumnValue>(this.columns.size());

    for(const column of this.columns.values()) {
      const i = column.position; // TODO, replace with iteration of this.columnsByPosition

      const input = inputs.get(column.id);
      if (input === undefined) {
        resolvedRow[i] = existingRow[i];
        break;
      }

      resolvedRow[i] = column.resolveInput(input, "update");
    }

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
    for (const [name, check] of this.checks.entries()) {
      // evaluate the check expression in the context of the resolved row
      // assuming check.expr is a function (ResolvedRow, Table) => boolean
      if (false) {//!check.expr(row, this)) {
        throw new Error(`Check constraint '${name}' violated`);
      }
    }
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