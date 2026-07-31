# Module Context Snapshot: `relational`
*Generated on: 2026-07-26 19:11:04*
*Target Path: `/mnt/e/Git/chain-reg-ts/src/relational`*

---
## 1. Directory Tree
```text
relational/
    Check.ts
    Column.ts
    ColumnBoundImmutable.ts
    Constraint.ts
    ConstraintKind.ts
    Database.ts
    Databases.ts
    ForeignKey.ts
    ForeignKeyReference.ts
    Index.ts
    PrimaryKey.ts
    ReferentialAction.ts
    RowView.ts
    Table.ts
    Unique.ts
    docs/
        module_overview.md
```
---
## 2. Public API Surface & Component Signatures

### File: Check.ts
export type CheckId = number & { readonly __brand: "CheckId" };

export class Check extends ColumnBoundImmutable {
  public readonly id: CheckId
  public readonly name: string
  public readonly columns: ColumnId[]
  public readonly resolvedPredicate: ResolvedPredicateNode
  public readonly predicate: Predicate
  validate()
  public static create(spec: { id: CheckId, name: string, resolvedPredicate: ResolvedPredicateNode, predicate: Predicate, }): Check
  public rename(newName: string): Check
  public tryBindPredicate(table: Table)
}

========================================
### File: Column.ts
export type ColumnId = number & { readonly __brand: "ColumnId" };

export class Column extends Immutable {
  public readonly name: string
  public readonly type: ColumnType
  public readonly nullable: boolean
  public readonly defaultValue?: ColumnValue
  public readonly enumValues?: readonly ColumnValue[]
  public readonly autoIncrementStep?: number
  public readonly autoIncrementStart?: number
  public readonly id: ColumnId
  public readonly position: number
  public readonly data: ColumnValue[]
  public readonly autoIncrementNext?: number
  validate(): void
}

export type ColumnSpec = {
  name: string;
  type: ColumnType;
  nullable?: boolean;
  defaultValue?: ColumnValue;
  enumValues?: readonly ColumnValue[];
  autoIncrementStep?: number;
  autoIncrementStart?: number;
};

export type InlineColumnSpec = Omit<ColumnSpec, 'name'> & {
  unique?: boolean;
  primaryKey?: boolean;
  references?: {
    table: string,
    column: string,
    onDelete?: ReferentialAction,
    onUpdate?: ReferentialAction,
  };
  check?: PredicateNode;
};

export type ColumnShape = Omit<ColumnSpec, 'name'> & {
  autoIncrement?: {
    next?: number;  
    step: number;
  };
}

========================================
### File: ColumnBoundImmutable.ts
interface ColumnBoundObject {
  readonly columns: ColumnId[];
  
  referencesColumn(id: ColumnId): boolean;
}

export abstract class ColumnBoundImmutable {
}

========================================
### File: Constraint.ts
export type PrimaryKeySpec = {
  kind: CONSTRAINT_KIND.primaryKey,
  name: string,
  columns: string[],
}

export type UniqueSpec = {
  kind: CONSTRAINT_KIND.unique,
  name: string,
  columns: string[]
}

export type ForeignKeySpec = {
  kind: CONSTRAINT_KIND.foreignKey,
  name: string,
  columns: string[],
  parentTable: string,
  parentColumns: string[],
  onDelete?: ReferentialAction,
  onUpdate?: ReferentialAction,
}

export type CheckSpec = {
  kind: CONSTRAINT_KIND.check,
  name: string,
  predicate: PredicateNode,
}

export type ConstraintSpec =
  | PrimaryKeySpec
  | UniqueSpec
  | ForeignKeySpec
  | CheckSpec

export type DropConstraintSpec =
  | { name: string }
  | { kind: CONSTRAINT_KIND.primaryKey };

========================================
### File: Database.ts
export type DatabaseId = number & { readonly __brand: "DatabaseId" };

export class Database extends Immutable {
  public readonly id: DatabaseId
  public readonly name: string
  public readonly tables: NamedObjectStore<Table, TableId>
  public readonly tableIds: IdAllocator<TableId>
  constructor(spec: { id: DatabaseId, name: string, })
  public validate()
  public static create(spec: { name: string, id: DatabaseId, }): Database
  public addTable(table: Table): this
  public updateTable(table: Table): this
  public createTable(spec: { name: string }): this
  public removeTable(name: string): Database
  public removeTableById(id: TableId): Database
  public renameTable(name: string, newName: string): Database
  public renameTableById(id: TableId, newName: string): Database
  public createForeignKey( tableName: string, spec: { name: string, columns: string[], reverseIndex: string, parentTable: string, parentColumns: string[], onDelete?: ReferentialAction, onUpdate?: ReferentialAction, }): Database
  public assertExistingRowsSatisfyForeignKey( childTable: Table, foreignKey: ForeignKey, )
  public assertNoForeignKeyReferencesAny( tableId: TableId, columns: ColumnId[] ): void
  public assertNoForeignKeyReferencesExact( tableId: TableId, columnNames: string[] ): void
  public addRow(tableName: string, row: ColumnValue[]): Database
}

========================================
### File: Databases.ts
export class Databases extends Immutable {
  public readonly databases: NamedObjectStore<Database, DatabaseId>
  public readonly databaseIds: IdAllocator<DatabaseId>
  public constructor()
  public validate(): void
  public get(id: DatabaseId): Database | undefined
  public getByName(name: string): Database | undefined
  public require(id: DatabaseId): Database
  public requireByName(name: string): Database
  public create(spec: { name: string }): Databases
  public add(database: Database): Databases
  public update(database: Database): Databases
  public remove(id: DatabaseId)
}

========================================
### File: ForeignKey.ts
export type ForeignKeyId = number & { readonly __brand: "ForeignKeyId" };

export class ForeignKey extends ColumnBoundImmutable {
  public readonly id: ForeignKeyId
  public readonly name: string
  public readonly columns: ColumnId[]
  public readonly parentTable: TableId
  public readonly parentColumns: ColumnId[]
  public readonly parentIndex: IndexId
  public readonly reverseIndex: IndexId
  public readonly onDelete: ReferentialAction
  public readonly onUpdate: ReferentialAction
  validate()
  public static create(spec: { id: ForeignKeyId, name: string, columns: ColumnId[], parentTable: TableId, parentColumns: ColumnId[], parentIndex: IndexId, reverseIndex: IndexId, onDelete?: ReferentialAction, onUpdate?: ReferentialAction, }): ForeignKey
  public rename(newName: string): ForeignKey
  public static defaultIndexName(name: string): string
}

export class CompiledForeignKey {
  constructor( public readonly fk: ForeignKey, public readonly columnIndexes: number[], public readonly parentColumnIndexes: number[], )
  public projectChildValues(values: readonly ColumnValue[]): ColumnValue[]
  public projectParentValues(values: readonly ColumnValue[]): ColumnValue[]
  public applyReferentialActionToRow( existingChildRow: ColumnValue[], replacementParentRow: readonly ColumnValue[] | undefined, action: ReferentialAction, ): ColumnValue[]
}

========================================
### File: ForeignKeyReference.ts
export type ForeignKeyReference = {
  tableName: string;
  foreignKey: ForeignKey;
};

========================================
### File: Index.ts
export type IndexSpec = {
  name: string,
  columns: string[],
  unique?: boolean,
  nullsDistinct?: boolean;
  predicate?: Predicate;
};

export type IndexId = number & { readonly __brand: "IndexId" };

export class Index extends ColumnBoundImmutable {
  public readonly name: string
  public readonly columns: ColumnId[]
  public readonly columnIndexes: number[]
  public readonly unique: boolean
  public readonly nullsDistinct: boolean
  public readonly predicate?: Predicate
  public readonly id: IndexId
  public readonly map: Map<string, number[]>
  validate()
  public static create(spec: { id: IndexId, name: string, columns: ColumnId[], columnIndexes: number[], unique?: boolean, nullsDistinct?: boolean, predicate?: Predicate }): Index
  public build(rows: Iterable<RowView>): Index
  public rename(newName: string): Index
  public assertColumnUnreferenced(id: ColumnId): void
  public tryAddRow(row: RowView): Index
  public tryRemoveRow(row: RowView): Index
  public tryUpdateRow( oldRow: RowView, newRow: RowView, ): Index
  public tryUpdateColumnIndexes(columnIdToIndexMap: Map<ColumnId, number>): Index
  public projectValues(values: readonly ColumnValue[]): ColumnValue[]
  public hasProjectedValues(projection: readonly ColumnValue[]): boolean
  public hasRow(values: readonly ColumnValue[]): boolean
  public getRowNumsFromProjection(projection: readonly ColumnValue[]): number[] | undefined
}

========================================
### File: PrimaryKey.ts
export class PrimaryKey extends Immutable {
}

========================================
### File: ReferentialAction.ts
export type ReferentialAction =
  | "restrict"
  | "cascade"
  | "setNull"
  | "noAction";

========================================
### File: RowView.ts
export type RowView = {
  index: number;
  readonly values: readonly ColumnValue[];
};

========================================
### File: Table.ts
export type TableId = number & { readonly __brand: "TableId" };

export class Table extends Immutable {
  public id: TableId
  public name: string
  public columns: NamedObjectStore<Column, ColumnId>
  public columnPositions: PersistentMap<number, ColumnId>
  public primaryKey: PrimaryKey | undefined
  public indexes: NamedObjectStore<Index, IndexId>
  public uniques: NamedObjectStore<Unique, UniqueId>
  public foreignKeys: NamedObjectStore<ForeignKey, ForeignKeyId>
  public checks: NamedObjectStore<Check, CheckId>
  public rowAlive: boolean[]
  public numRows: number
  public readonly columnIds
  public readonly indexIds
  public readonly uniqueIds
  public readonly foreignKeyIds
  public readonly checkIds
  public validate(): void
  constructor(spec: { id: TableId, name: string, })
  public static create(spec: { id: TableId, name: string, }): Table
  public rename(newName: string): Table
  public getColumnPosition(id: ColumnId): number | undefined
  public requireColumnPosition(id: ColumnId): number
  public createColumn(spec: ColumnSpec): Table
  public removeColumn(name: string): Table
  public removeColumnById(id: ColumnId): Table
  public renameColumn(name: string, newName: string): Table
  public renameColumnById(id: ColumnId, newName: string): Table
  public alterColumn(name: string, newType: ColumnType): Table
  public alterColumnById(id: ColumnId, newType: ColumnType): Table
  public createPrimaryKey(spec: { name: string, columns: string[], }): Table
  public removePrimaryKey(): Table
  public *iterateAliveRows(): IterableIterator<RowView>
  public createForeignKey( spec: { name: string, columns: ColumnId[], reverseIndex: IndexId, parentTable: TableId, parentColumns: ColumnId[], parentIndex: IndexId, onDelete?: ReferentialAction, onUpdate?: ReferentialAction, } ): Table
  public removeForeignKey(name: string): Table
  public removeForeignKeyById(id: ForeignKeyId): Table
  public createCheck(spec: Omit<CheckSpec, "kind">): Table
  public getPrimaryKey(): PrimaryKey | undefined
  public requirePrimaryKey(): PrimaryKey
  public renamePrimaryKey(newName: string): Table
  public renameForeignKey(oldName: string, newName: string): Table
  public renameForeignKeyById(id: ForeignKeyId, newName: string): Table
  public getConstraintByName(name: string): PrimaryKey | ForeignKey | Check | Unique | undefined
  public requireConstraintByName(name: string): PrimaryKey | ForeignKey | Check | Unique
  public assertTableUnreferenced(id: TableId): void
  public createUnique(spec: { name: string, indexName: string ownsIndex: boolean, }): Table
  public removeUnique(name: string): Table
  public removeUniqueById(id: UniqueId): Table
  public renameUnique(name: string, newName: string): Table
  public renameUniqueById(id: UniqueId, newName: string): Table
  public createIndex(spec: IndexSpec & {internal?: boolean}): Table
  public removeIndex(name: string): Table
  public removeIndexById(id: IndexId): Table
  public removeCheck(name: string): Table
  public removeCheckById(id: CheckId): Table
  public renameIndex(name: string, newName: string): Table
  public renameIndexById(id: IndexId, newName: string): Table
  public renameCheck(name: string, newName: string): Table
  public renameCheckById(id: CheckId, newName: string): Table
  public isRowAlive(rowNum: number): boolean
  public assertRowAlive(rowNum: number): void
  public getRow(rowNum: number): ColumnValue[] | undefined
  public requireRow(rowNum: number): ColumnValue[]
  public getRowView(rowNum: number): RowView | undefined
  public requireRowView(rowNum: number): RowView
  public resolveInsertInputs( inputs: Map<ColumnId, ExplicitInput>, ): ColumnValue[]
  public resolveUpdateInputs( inputs: Map<ColumnId, ExplicitInput>, rowNum: number, ): ColumnValue[]
  public addRow(row: ColumnValue[]): Table
  public resolveUpdateExpressions( expressions: Map<ColumnId, Expression<RowView>>, rowNum: number ): ResolvedUpdate
  public updateRows(updates: ResolvedUpdate[]): Table
  public removeRows(deletes: ResolvedDelete[]): Table
  public requireUniqueIndexByColumns(columns: ColumnId[]): Index
}

========================================
### File: Unique.ts
export type UniqueId = number & { readonly __brand: "UniqueId" };

export class Unique extends Immutable {
  public readonly id: UniqueId
  public readonly name: string
  public readonly index: IndexId
  public readonly ownsIndex: boolean
  validate(): void
  public static create(spec: { id: UniqueId, name: string, index: IndexId, ownsIndex: boolean, }): Unique
  public rename(newName: string): Unique
  public static defaultIndexName(name: string): string
}

========================================

---
## 3. Structural Module Relationships

### Check.ts
  ↳ [References / Uses Class]    -> Table (defined via property: `public tryBindPredicate(table: Table)`)

### Column.ts
  ↳ [Imports / References File]  -> ReferentialAction.ts

### ColumnBoundImmutable.ts
  ↳ [Imports / References File]  -> Column.ts

### Constraint.ts
  ↳ [Imports / References File]  -> ReferentialAction.ts

### Database.ts
  ↳ [Owns / Contains Collection] -> ReferentialAction (defined via property: `public createForeignKey( tableName: string, spec: { name: string, columns: string[], reverseIndex: string, parentTable: string, parentColumns: string[], onDelete?: ReferentialAction, onUpdate?: ReferentialAction, }): Database`)
  ↳ [Owns / Contains Collection] -> Table (defined via property: `public readonly tables: NamedObjectStore<Table, TableId>`)
  ↳ [References / Uses Class]    -> ForeignKey (defined via property: `public assertExistingRowsSatisfyForeignKey( childTable: Table, foreignKey: ForeignKey, )`)
  ↳ [References / Uses Class]    -> Table (defined via property: `public addTable(table: Table): this`)
  ↳ [References / Uses Class]    -> Table (defined via property: `public assertExistingRowsSatisfyForeignKey( childTable: Table, foreignKey: ForeignKey, )`)
  ↳ [References / Uses Class]    -> Table (defined via property: `public updateTable(table: Table): this`)

### Databases.ts
  ↳ [Owns / Contains Collection] -> Database (defined via property: `public readonly databases: NamedObjectStore<Database, DatabaseId>`)
  ↳ [References / Uses Class]    -> Database (defined via property: `public add(database: Database): Databases`)
  ↳ [References / Uses Class]    -> Database (defined via property: `public get(id: DatabaseId): Database | undefined`)
  ↳ [References / Uses Class]    -> Database (defined via property: `public getByName(name: string): Database | undefined`)
  ↳ [References / Uses Class]    -> Database (defined via property: `public require(id: DatabaseId): Database`)
  ↳ [References / Uses Class]    -> Database (defined via property: `public requireByName(name: string): Database`)
  ↳ [References / Uses Class]    -> Database (defined via property: `public update(database: Database): Databases`)

### ForeignKey.ts
  ↳ [Owns / Contains Collection] -> ForeignKey (defined via property: `constructor( public readonly fk: ForeignKey, public readonly columnIndexes: number[], public readonly parentColumnIndexes: number[], )`)
  ↳ [Owns / Contains Collection] -> ReferentialAction (defined via property: `public applyReferentialActionToRow( existingChildRow: ColumnValue[], replacementParentRow: readonly ColumnValue[] | undefined, action: ReferentialAction, ): ColumnValue[]`)
  ↳ [Owns / Contains Collection] -> ReferentialAction (defined via property: `public static create(spec: { id: ForeignKeyId, name: string, columns: ColumnId[], parentTable: TableId, parentColumns: ColumnId[], parentIndex: IndexId, reverseIndex: IndexId, onDelete?: ReferentialAction, onUpdate?: ReferentialAction, }): ForeignKey`)
  ↳ [References / Uses Class]    -> ReferentialAction (defined via property: `public readonly onDelete: ReferentialAction`)
  ↳ [References / Uses Class]    -> ReferentialAction (defined via property: `public readonly onUpdate: ReferentialAction`)

### ForeignKeyReference.ts
  ↳ [Imports / References File]  -> ForeignKey.ts

### Index.ts
  ↳ [References / Uses Class]    -> RowView (defined via property: `public build(rows: Iterable<RowView>): Index`)
  ↳ [References / Uses Class]    -> RowView (defined via property: `public tryAddRow(row: RowView): Index`)
  ↳ [References / Uses Class]    -> RowView (defined via property: `public tryRemoveRow(row: RowView): Index`)
  ↳ [References / Uses Class]    -> RowView (defined via property: `public tryUpdateRow( oldRow: RowView, newRow: RowView, ): Index`)

### PrimaryKey.ts
  ↳ [Imports / References File]  -> Index.ts

### ReferentialAction.ts
  (Stand-alone utility module or leaf node—no direct internal dependencies)

### RowView.ts
  (Stand-alone utility module or leaf node—no direct internal dependencies)

### Table.ts
  ↳ [Owns / Contains Collection] -> Check (defined via property: `public checks: NamedObjectStore<Check, CheckId>`)
  ↳ [Owns / Contains Collection] -> Column (defined via property: `public columns: NamedObjectStore<Column, ColumnId>`)
  ↳ [Owns / Contains Collection] -> ForeignKey (defined via property: `public foreignKeys: NamedObjectStore<ForeignKey, ForeignKeyId>`)
  ↳ [Owns / Contains Collection] -> Index (defined via property: `public indexes: NamedObjectStore<Index, IndexId>`)
  ↳ [Owns / Contains Collection] -> Index (defined via property: `public requireUniqueIndexByColumns(columns: ColumnId[]): Index`)
  ↳ [Owns / Contains Collection] -> ReferentialAction (defined via property: `public createForeignKey( spec: { name: string, columns: ColumnId[], reverseIndex: IndexId, parentTable: TableId, parentColumns: ColumnId[], parentIndex: IndexId, onDelete?: ReferentialAction, onUpdate?: ReferentialAction, } ): Table`)
  ↳ [Owns / Contains Collection] -> RowView (defined via property: `public resolveUpdateExpressions( expressions: Map<ColumnId, Expression<RowView>>, rowNum: number ): ResolvedUpdate`)
  ↳ [Owns / Contains Collection] -> Unique (defined via property: `public uniques: NamedObjectStore<Unique, UniqueId>`)
  ↳ [References / Uses Class]    -> Check (defined via property: `public getConstraintByName(name: string): PrimaryKey | ForeignKey | Check | Unique | undefined`)
  ↳ [References / Uses Class]    -> Check (defined via property: `public requireConstraintByName(name: string): PrimaryKey | ForeignKey | Check | Unique`)
  ↳ [References / Uses Class]    -> CheckSpec (defined via property: `public createCheck(spec: Omit<CheckSpec, "kind">): Table`)
  ↳ [References / Uses Class]    -> ColumnSpec (defined via property: `public createColumn(spec: ColumnSpec): Table`)
  ↳ [References / Uses Class]    -> ForeignKey (defined via property: `public getConstraintByName(name: string): PrimaryKey | ForeignKey | Check | Unique | undefined`)
  ↳ [References / Uses Class]    -> ForeignKey (defined via property: `public requireConstraintByName(name: string): PrimaryKey | ForeignKey | Check | Unique`)
  ↳ [References / Uses Class]    -> IndexSpec (defined via property: `public createIndex(spec: IndexSpec & {internal?: boolean}): Table`)
  ↳ [References / Uses Class]    -> PrimaryKey (defined via property: `public getConstraintByName(name: string): PrimaryKey | ForeignKey | Check | Unique | undefined`)
  ↳ [References / Uses Class]    -> PrimaryKey (defined via property: `public getPrimaryKey(): PrimaryKey | undefined`)
  ↳ [References / Uses Class]    -> PrimaryKey (defined via property: `public primaryKey: PrimaryKey | undefined`)
  ↳ [References / Uses Class]    -> PrimaryKey (defined via property: `public requireConstraintByName(name: string): PrimaryKey | ForeignKey | Check | Unique`)
  ↳ [References / Uses Class]    -> PrimaryKey (defined via property: `public requirePrimaryKey(): PrimaryKey`)
  ↳ [References / Uses Class]    -> RowView (defined via property: `public *iterateAliveRows(): IterableIterator<RowView>`)
  ↳ [References / Uses Class]    -> RowView (defined via property: `public getRowView(rowNum: number): RowView | undefined`)
  ↳ [References / Uses Class]    -> RowView (defined via property: `public requireRowView(rowNum: number): RowView`)
  ↳ [References / Uses Class]    -> Unique (defined via property: `public getConstraintByName(name: string): PrimaryKey | ForeignKey | Check | Unique | undefined`)
  ↳ [References / Uses Class]    -> Unique (defined via property: `public requireConstraintByName(name: string): PrimaryKey | ForeignKey | Check | Unique`)

### Unique.ts
  ↳ [Imports / References File]  -> Index.ts