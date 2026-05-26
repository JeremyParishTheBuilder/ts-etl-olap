import {
  type ColumnSpec,
  type ColumnValue,
  type ColumnType,
  Column,
  assertTypeIndexable,
} from "./Column.js";
import { PrimaryKey } from "./PrimaryKey.js";
import { ForeignKey } from "./ForeignKey.js";
import { type Check } from "./Check.js";
import { type Expression } from "./Expression.js";
import {
  Index,
  IndexSpec,
  requiresIndexRebuild,
} from "./Index.js";
import { Immutable } from "../infrastructure/Immutable.js";
import { ColumnBoundImmutable } from "./ColumnBoundImmutable.js";
import { PersistentMap } from "../infrastructure/PersistentMap.js";
import { type RowView } from "./RowView.js";
import { normalizeIdentifier } from "../utils/normalizeIdentifier.js";
import { ForeignKeySpec, PrimaryKeySpec } from "./Constraint.js";
import { ReferentialAction } from "./ReferentialAction.js";


export class Table extends Immutable {
  public    columns:        PersistentMap<string, Column> = new PersistentMap();

  public    foreignKeys:    PersistentMap<string, ForeignKey> = new PersistentMap();
  public    checks:         PersistentMap<string, Check> = new PersistentMap();
  public    primaryKey:     PrimaryKey | undefined;
  public    indexes:        PersistentMap<string, Index> = new PersistentMap();

  public    rowAlive:       boolean[]            = [];
  public    numRows:        number               = 0;
  
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
  public getColumn(columnName: string): Column | undefined {
    return this.columns.get(normalizeIdentifier(columnName));
  }

  public requireColumn(columnName: string): Column {
    return this.columns.require(normalizeIdentifier(columnName));
  }

  public requireColumns(columnNames: string[]): Column[] {
    const columns: Column[] = [];
    columnNames.forEach((columnName: string) => {
      columns.push(this.requireColumn(columnName));
    });
    return columns;
  }

  private assertColumnNameUnused(name: string): void {
    if (this.getColumn(name)) {
      throw new Error(`Column name ${name} is not unused`);
    }
  }

  public addColumn(spec: ColumnSpec): Table {
    this.assertColumnNameUnused(spec.name);

    const column = Column.fromSpec(spec, this.columns.map.size);
    
    if (
      column.nullable === false &&
      column.defaultValue === undefined &&
      this.numRows > 0
    ) {
      throw new Error(`New non-nullable column ${column.name} unable to backfill without a default value`);
    }

    return this.with({
      columns: this.columns.add(normalizeIdentifier(column.name), column),
    } as Partial<this>);
  }

  public removeColumn(name: string): Table {
    const column = this.requireColumn(name);

    this.assertColumnNameUnreferenced(name);

    const updatedColumns = this.columns.mapValues(c => 
      c.tryDecrementPosition(column.position)
    ).remove(normalizeIdentifier(name));

    const columnNameToIndexMap = new Map<string, number>();
    updatedColumns.forEach(column =>
      columnNameToIndexMap.set(
        normalizeIdentifier(column.name),
        column.position
      )
    );

    const updatedIndexes = this.indexes.mapValues(c => 
      c.tryUpdateColumnIndexes(columnNameToIndexMap)
    );

    const updatedForiegnKeys = this.foreignKeys.mapValues(c => 
      c.tryUpdateColumnIndexes(columnNameToIndexMap)
    );

    return this.with({
      columns: updatedColumns,//.remove(normalizeIdentifier(name)),
      indexes: updatedIndexes,
      foreignKeys: updatedForiegnKeys,
    } as Partial<this>);
  }

  public renameColumn(oldName: string, newName: string): Table {
    if (oldName === newName) return this;

    this.assertColumnNameUnused(newName);

    const column = this.requireColumn(oldName);
    const renamedColumn = column.rename(newName);

    const updatedColumns = this.columns
      .remove(normalizeIdentifier(oldName))
      .add(normalizeIdentifier(newName), renamedColumn);

    return this.with({
      columns: updatedColumns,
      foreignKeys: this.foreignKeys.mapValues(c => c.tryRenameColumn(oldName, newName)),
      checks: this.checks.mapValues(c => c.tryRenameColumn(oldName, newName)),
      indexes: this.indexes.mapValues(i => i.tryRenameColumn(oldName, newName)),
    } as Partial<this>);
  }

  public alterColumn(name: string, newType: ColumnType): Table {
    const column = this.requireColumn(name);

    if (column.type === newType) return this;
    
    if (this.indexes.some(i => i.referencesColumn(name))) {
      assertTypeIndexable(newType);
    }

    if (this.foreignKeys.some(c => c.referencesColumn(name))) {
      throw new Error(`Cannot alter column: ${name}, referenced by foreignKeys.`);
    }

    const updatedChecks = this.checks.mapValues(c => c.tryAlterColumn(name, newType));

    const updatedColumns = this.columns.update(
      normalizeIdentifier(name),
      column.alter(newType)
    );

    const tableWithUpdatedColumns = this.with({
      columns: updatedColumns,
    } as Partial<this>);

    let updatedIndexes = this.indexes;
    if (requiresIndexRebuild(column.type, newType)) {
      updatedIndexes = this.indexes.mapValues(index =>
        index.referencesColumn(name)
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
  private assertNoDuplicateUniqueColumnSet(columns: string[]): void {
    this.indexes.forEach(index => {
      if (sameColumnSet(index.columns, columns.map(normalizeIdentifier)) && index.unique) {
        throw new Error(
          `Unique constraint on columns [${columns.join(", ")}] already exists`
        );
      }
    });
  }

  public addPrimaryKey(pk: PrimaryKey): Table {
    if (this.primaryKey) {
      throw new Error(`Primary Key ${this.primaryKey} already exists`);
    }

    const normalizedName = normalizeIdentifier(pk.name);
    const sharesBackingIndexName = normalizedName === pk.index;
    if (!sharesBackingIndexName) {
      this.assertConstraintNameUnused(pk.name);
    }

    this.requireColumns(pk.columns).forEach(column => {
      if(column.nullable !== false) {
        throw new Error(`Column ${column.name} must be 'not nullable'.`);
      }
    });

    const index = this.requireIndex(pk.index);

    if (!index.unique) {
      throw new Error(`Referenced PrimaryKey index is not unique`);
    }

    if (!arraysEqual(pk.columns, index.columns)) {
      throw new Error(`Primary Key columns does not match index columns`);
    }

    return this.with({
      primaryKey: pk,
    } as Partial<this>);
  }

  public createPrimaryKey(spec: Omit<PrimaryKeySpec, "kind">): Table {
    if (this.primaryKey) {
      throw new Error(`Primary Key ${this.primaryKey} already exists`);
    }

    const primaryKey = PrimaryKey.create(spec);

    const normalizedName = normalizeIdentifier(primaryKey.name);

    const sharesBackingIndexName =
      primaryKey.index === normalizedName;
    if (!sharesBackingIndexName) {
      this.assertConstraintNameUnused(spec.name);
    }

    this.requireColumns(primaryKey.columns).forEach(column => {
      if(column.nullable !== false) {
        throw new Error(`Column ${column.name} must be 'not nullable'.`);
      }
    });

    const index = this.requireIndex(primaryKey.index);

    if (!index.unique) {
      throw new Error(`Referenced PrimaryKey index is not unique`);
    }

    if (!arraysEqual(primaryKey.columns, index.columns)) {
      throw new Error(`Primary Key columns does not match index columns`);
    }

    return this.with({
      primaryKey,
    } as Partial<this>);
  }

  public removePrimaryKey(): Table {
    const pk = this.requirePrimaryKey();

    let indexes = this.indexes;

    if (normalizeIdentifier(pk.name) === pk.index) {
      indexes = this.indexes.remove(pk.index);
    }

    return this.with({
      indexes,
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
    spec: Omit<ForeignKeySpec, "kind"> & {
      parentIndex: string,
      onDelete?: ReferentialAction,
      onUpdate?: ReferentialAction,
    }
  ): Table {
    this.assertConstraintNameUnused(spec.name);

    const columnIndexes = this.requireColumns(spec.columns).map(c => c.position);

    const foreignKey = ForeignKey.create({...spec, columnIndexes});

    this.assertIndexNameUnused(foreignKey.reverseIndex);

    const fkReverseIndex = Index.create({
      name: foreignKey.reverseIndex,
      columns: spec.columns,
      columnIndexes: columnIndexes,
      unique: false,
      ownerConstraint: normalizeIdentifier(spec.name),
    });
    
    const builtIndex = fkReverseIndex.build(this.iterateAliveRows());

    return this.with({
      foreignKeys: this.foreignKeys.add(
        normalizeIdentifier(foreignKey.name),
        foreignKey,
      ),
      indexes: this.indexes.add(
        normalizeIdentifier(builtIndex.name),
        builtIndex,
      ),
    } as Partial<this>);
  }

  public removeForeignKey(name: string): Table {
    const fk = this.requireForeignKey(name);

    return this.with({
      foreignKeys: this.foreignKeys.remove(normalizeIdentifier(name)),
      indexes: this.indexes.remove(fk.reverseIndex),
    } as Partial<this>);
  }

  public updateForeignKey(fk: ForeignKey): Table {
    return this.with({
      foreignKeys: this.foreignKeys
        .remove(normalizeIdentifier(fk.name))
        .add(normalizeIdentifier(fk.name), fk),
    } as Partial<this>);
  }

  public addCheck(check: Check): Table {
    this.assertConstraintNameUnused(check.name);

    this.requireColumns(check.columns);

    return this.with({
      checks: this.checks.add(normalizeIdentifier(check.name), check),
    } as Partial<this>);
  }

  public removeCheck(name: string): Table {
    this.requireCheck(name);

    return this.with({
      checks: this.checks.remove(normalizeIdentifier(name)),
    } as Partial<this>);
  }

  public updateCheck(check: Check): this {
    return this.with({
      checks: this.checks.update(normalizeIdentifier(check.name), check),
    } as Partial<this>);
  }

  public assertColumnNameUnreferenced(name: string) {
    if (
      this.primaryKey?.referencesColumn(name) ||
      this.foreignKeys.some(c => c.referencesColumn(name)) ||
      this.checks.some(c => c.referencesColumn(name)) ||
      this.indexes.some(i => i.referencesColumn(name))
    ) {
      throw new Error(`Column name: ${name} is referenced by some Constraint or Index`);
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

  public renamePrimaryKey(name: string): Table {
    const normalizedName = normalizeIdentifier(name);

    const pk = this.requirePrimaryKey();

    if (normalizeIdentifier(pk.name) === normalizedName) return this;

    const sharesBackingIndexName = normalizedName === pk.index;
    const existingConstraint = this.getConstraintByName(name);
    if (
      !sharesBackingIndexName &&
      existingConstraint &&
      existingConstraint !== pk
    ) {
      throw new Error(`Existing constraint already using new name: ${name}`);
    }

    const renamedPrimaryKey = pk.rename(name);

    return this.with({
      primaryKey: renamedPrimaryKey,
    } as Partial<this>);
  }

  public requireForeignKey(name: string): ForeignKey {
    return this.foreignKeys.require(normalizeIdentifier(name));
  }

  public renameForeignKey(oldName: string, newName: string): Table {
    if (oldName === newName) return this;

    const normalizedOldName = normalizeIdentifier(oldName);
    const normalizedNewName = normalizeIdentifier(newName);

    if (normalizedOldName !== normalizedNewName) {
      this.assertConstraintNameUnused(newName);
    }
    
    const fk = this.requireForeignKey(oldName);

    const renamedForeignKey = fk.rename(newName);

    const updatedForeignKey = renamedForeignKey.withReverseIndex(newName);

    const updatedForeignKeys = this.foreignKeys
      .remove(normalizedOldName)
      .add(normalizedNewName, updatedForeignKey);

    const newIndexName = updatedForeignKey.reverseIndex;

    let updatedIndexes = this.indexes;

    if (newIndexName !== fk.reverseIndex) {
      this.assertIndexNameUnused(newIndexName);

      const index = this.requireIndex(fk.reverseIndex);

      const renamedIndex = index.rename(newIndexName);

      const updatedIndex = renamedIndex.withOwnerConstraint(newName);

      updatedIndexes = updatedIndexes
        .remove(fk.reverseIndex)
        .add(newIndexName, updatedIndex);
    }

    return this.with({
      foreignKeys: updatedForeignKeys,
      indexes: updatedIndexes,
    } as Partial<this>);
  }

  public requireCheck(name: string): Check {
    return this.checks.require(normalizeIdentifier(name));
  }

  public renameCheck(oldName: string, newName: string): Table {
    const normalizedName = normalizeIdentifier(newName);

    if (normalizeIdentifier(oldName) === normalizedName) return this;

    this.assertConstraintNameUnused(newName);
    
    const check = this.requireCheck(oldName);

    const renamedCheck = check.rename(newName);

    const updatedChecks = this.checks
      .remove(normalizeIdentifier(oldName))
      .add(normalizedName, renamedCheck);

    return this.with({
      checks: updatedChecks,
    } as Partial<this>);
  }

  public getConstraintByName(name: string): ColumnBoundImmutable | undefined {
    const normalizedName = normalizeIdentifier(name);

    if (
      this.primaryKey &&
      normalizeIdentifier(this.primaryKey.name) === normalizedName
    ) {
      return this.requirePrimaryKey();
    } else if (
      this.indexes.has(normalizedName) &&
      this.requireIndex(name).unique
    ) {
      return this.requireIndex(name);
    } else if (this.foreignKeys.has(normalizedName)) {
      return this.requireForeignKey(name);
    } else if (this.checks.has(normalizedName)) {
      return this.requireCheck(name); // TODO, add requireCheck
    } else { return undefined; }
  }

  public requireConstraintByName(name: string): ColumnBoundImmutable {
    const constraint = this.getConstraintByName(name);
    if (!constraint) {
      throw new Error(`No constraint named: ${name}`);
    }
    return constraint;
  }

  private assertConstraintNameUnused(name: string): void {
    if (this.getConstraintByName(name)) {
      throw new Error(`Constraint name already used`);
    }
  }

  public assertTableNameUnreferenced(name: string): void {
    this.foreignKeys.forEach(fk => {
      if (fk.parentTable === normalizeIdentifier(name)) {
        throw new Error(`Foreign Key ${fk.name} references table ${name}`);
      }}
    );
  }
  //  </constraints>

  //  <indexes>  

  // private buildIndexPredicate(where?: (rowNum: number) => boolean): ((row: number) => boolean) {
  //   return (row: number) =>
  //     (!this.ignoreRowAlive ? this.isRowAlive(row) : true) &&
  //     (where ? where(row) : true);
  // }

  public requireIndex(name: string): Index {
    return this.indexes.require(normalizeIdentifier(name));
  }

  public getIndex(name: string): Index | undefined {
    return this.indexes.get(normalizeIdentifier(name));
  }

  // private buildIndex(
  //   index: Index
  // ): Index {
  //   const columns = this.requireColumns(index.columns);

  //   // const getValuesFromColumns = (rowNum: number) =>
  //   //   columns.map(c => c.data[rowNum]);

  //   return index.build(this.iterateAliveRows());
  //     // {
  //     //   rowCount: this.numRows,
  //     //   predicate: this.buildIndexPredicate(index.where),
  //     //   getValues: getValuesFromColumns,
  //     // }
  //   );
  // }

  public createIndex(spec: IndexSpec): Table {
    if (spec.unique) {
      this.assertConstraintNameUnused(spec.name);
      this.assertNoDuplicateUniqueColumnSet(spec.columns);
    }

    this.assertIndexNameUnused(spec.name);

    const columnIndexes = this.requireColumns(spec.columns).map(c => c.position);

    const index = Index.create({...spec, columnIndexes});

    const builtIndex = index.build(this.iterateAliveRows());

    return this.with({
      indexes: this.indexes.add(
        normalizeIdentifier(builtIndex.name),
        builtIndex,
      ),
    } as Partial<this>);
  }

  public removeIndex(name: string): Table {
    const index = this.requireIndex(name);

    if (normalizeIdentifier(name) === this.primaryKey?.index) {
      throw new Error(`Cannot remove index when referenced by Primary Key`);
    }

    if (index.ownerConstraint) {
      throw new Error(`Cannot remove index owned by a constraint`);
    }

    return this.with({
      indexes: this.indexes.remove(normalizeIdentifier(name)),
    } as Partial<this>);
  }

  private assertIndexNameUnused(name: string): void {
    if (this.indexes.has(normalizeIdentifier(name))) {
      throw new Error(`Index name ${name} is not unused`);
    }
  }

  public renameIndex(oldName: string, newName: string): Table {
    if (oldName === newName) return this;

    const normalizedOldName = normalizeIdentifier(oldName);
    const normalizedNewName = normalizeIdentifier(newName);

    if (normalizedOldName !== normalizedNewName) {
      this.assertIndexNameUnused(newName);
    }

    const index = this.requireIndex(oldName);

    if (index.ownerConstraint) {
      throw new Error(`Cannot rename index owned by a constraint`);
    }

    const renamedIndex = index.rename(newName);

    const updatedIndexes = this.indexes
      .remove(normalizedOldName)
      .add(normalizedNewName, renamedIndex);

    const updatedPrimaryKey =
      this.primaryKey &&
      this.primaryKey.index === normalizeIdentifier(oldName)
        ? this.primaryKey.renameIndex(newName)
        : this.primaryKey;

    return this.with({
      indexes: updatedIndexes,
      primaryKey: updatedPrimaryKey,
    } as Partial<this>);
  }
  //  </indexes>

  //  <select>
  public assertRowAlive(rowNum: number): void {
    if (this.numRows <= rowNum || this.rowAlive[rowNum] === false) {
      throw new Error(`Row ${rowNum} not alive`);
    }
  }

  public getRow(rowNum: number): ColumnValue[] | undefined {
    if (this.rowAlive[rowNum] === false) return undefined;

    const row: ColumnValue[] = [];
    for (const column of this.columns.map.values()) {
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
  private assertRowLength(row: ColumnValue[]): void {
    if (row.length !== this.columns.map.size) {
      throw new Error(`Resolved row length mismatch with table columns`);
    }
  }


  public normalizeRow(row: ColumnValue[], mode: "insert" | "update"): ColumnValue[] {
    this.assertRowLength(row);

    const normalizedRow: ColumnValue[] = new Array(row.length);

    this.columns.forEach(column => {
      const i = column.position;

      normalizedRow[i] =
        column.normalizeDatum(row[i], mode);
    });

    return normalizedRow;
  }

  public addRow(row: ColumnValue[]): Table {
    this.assertRowLength(row);

    const rowView = {
      index: this.numRows,
      values: row,
    };

    this.verifyRowAgainstTableConstraints(row); // CHECKs

    const updatedIndexes = this.indexes.mapValues(i => i.tryAddRow(rowView));
    //TODO, confirm whether it won't add a row with null when unique

    const updatedColumns = this.columns.mapValues(column =>
      column.addDatum(row[column.position])
    );

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

    this.verifyRowAgainstTableConstraints(row);

    const updatedIndexes = this.indexes.mapValues(
      index => index.tryUpdateRow(oldRow, newRow)
    );

    const updatedColumns = this.columns.mapValues(column =>
      column.updateDatum(row[column.position], rowNum)
    );

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

  public requireUniqueIndexByColumns(columns: string[]): Index {
    for (const index of this.indexes.values()) {
      if (
        index.unique &&
        arraysEqual(index.columns, columns.map(normalizeIdentifier))
      ) {
        return index;
      }
    }
    throw new Error(
      `No UNIQUE index found for columns [${columns.join(", ")}] in this exact order`
    );
  }

  private verifyRowAgainstTableConstraints(row: ColumnValue[]) {
    for (const [name, check] of this.checks.map) {
      // evaluate the check expression in the context of the resolved row
      // assuming check.expr is a function (ResolvedRow, Table) => boolean
      if (false) {//!check.expr(row, this)) {
        throw new Error(`Check constraint '${name}' violated`);
      }
    }
  }

  public tryRenameForeignKeyParentColumn(
    parentTableName: string,
    oldColumnName: string,
    newColumnName: string,
  ): this {
    if (
      normalizeIdentifier(oldColumnName)
      === normalizeIdentifier(newColumnName)
    ) {
      return this;
    }

    return this.with({
      foreignKeys: this.foreignKeys.mapValues(fk =>
        fk.tryRenameParentColumn(parentTableName, oldColumnName, newColumnName)),
    } as Partial<this>);
  }

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
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }

  return true;
}

//used for: addUnique()
function sameColumnSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;

  const setA = new Set(a);
  for (const col of b) {
    if (!setA.has(col)) return false;
  }
  return true;
}