import { normalizeIdentifier } from "../utils/normalizeIdentifier.js";
import { type ColumnId } from "./Column.js";
import { type ColumnValue } from "../types/ColumnValue.js";
import { ColumnBoundImmutable } from "./ColumnBoundImmutable.js";
import { type IndexId } from "./Index.js";
import { type ReferentialAction } from "./ReferentialAction.js";
import { type TableId } from "./Table.js";

export type ForeignKeyId = number & { readonly __brand: "ForeignKeyId" };

export class ForeignKey extends ColumnBoundImmutable {
  
  public readonly id: ForeignKeyId;
  public readonly name: string;
  public readonly columns: ColumnId[];
  public readonly parentTable: TableId;
  public readonly parentColumns: ColumnId[];
  public readonly parentIndex: IndexId;
  public readonly reverseIndex: IndexId;
  public readonly onDelete: ReferentialAction;
  public readonly onUpdate: ReferentialAction;

  protected constructor(spec: {
    id: ForeignKeyId,
    name: string,
    columns: ColumnId[],
    parentTable: TableId,
    parentColumns: ColumnId[],
    parentIndex: IndexId,
    reverseIndex: IndexId,
    onDelete?: ReferentialAction,
    onUpdate?: ReferentialAction,
  }) {
    super();

    this.id = spec.id;
    this.name = spec.name;
    this.columns = spec.columns;
    this.parentTable = spec.parentTable;
    this.parentColumns = spec.parentColumns;
    this.parentIndex = spec.parentIndex;
    this.reverseIndex = spec.reverseIndex;
    this.onDelete = spec.onDelete ?? "restrict";
    this.onUpdate = spec.onUpdate ?? "restrict";

    this.validate();
    this.seal();
  }

  validate() {
    super.validateColumns();

    if(this.columns.length !== this.parentColumns.length) {
      throw new Error(`Child-Parent Columns length mismatch`);
    }
  }

  public static create(spec: {
    id: ForeignKeyId,
    name: string,
    columns: ColumnId[],
    parentTable: TableId,
    parentColumns: ColumnId[],
    parentIndex: IndexId,
    reverseIndex: IndexId,
    onDelete?: ReferentialAction,
    onUpdate?: ReferentialAction,
  }): ForeignKey {
    return new this(spec);
  }

  public rename(newName: string): ForeignKey {
    return this.with({
      name: newName,
    } as Partial<this>);
  }

  public static defaultIndexName(name: string): string {
    return name.concat("_FKIDX");
  }

  // public withReverseIndex(newName: string): ForeignKey {
  //   return this.with({
  //     reverseIndex: getReverseIndexFromName(newName),
  //   } as Partial<this>);
  // }

  // public withParentIndex(parentIndex: IndexId): ForeignKey {
  //   return this.with({
  //     parentIndex: parentIndex,
  //   } as Partial<this>);
  // }

  // public tryRenameParentColumn(
  //   parentTableName: string,
  //   oldColumnName: string,
  //   newColumnName: string
  // ): ForeignKey {
  //   if (normalizeIdentifier(parentTableName) !== this.parentTable) return this;

  //   const normalizedName = normalizeIdentifier(newColumnName);

  //   if (normalizeIdentifier(oldColumnName) === normalizedName) return this;

  //   if (!this.parentColumns.includes(normalizeIdentifier(oldColumnName))) {
  //     return this;
  //   }

  //   const newParentColumns = this.parentColumns.map(col =>
  //     col === normalizeIdentifier(oldColumnName) ? normalizedName : col
  //   );

  //   return this.with({
  //     parentColumns: newParentColumns,
  //   } as Partial<this>);
  // }

  // public tryRenameParentTable(
  //   oldParentTableName: string,
  //   newParentTableName: string
  // ): ForeignKey {
  //   const normalizedName = normalizeIdentifier(newParentTableName);

  //   if (normalizeIdentifier(oldParentTableName) !== this.parentTable) {
  //     return this;
  //   }

  //   if (normalizeIdentifier(oldParentTableName) === normalizedName) {
  //     return this;
  //   }

  //   return this.with({
  //     parentTable: normalizedName,
  //   } as Partial<this>);
  // }

  // public tryUpdateColumnIndexes(columnIdToIndexMap: Map<ColumnId, number>): ForeignKey {
  //   const updatedColumnIndexes = [...this.columnIndexes];
    
  //   for (let i = 0; i < this.columns.length; i++) {
  //     updatedColumnIndexes[i] = columnIdToIndexMap.get(this.columns[i])!;
  //   }

  //   return this.with({
  //     columnIndexes: updatedColumnIndexes
  //   } as Partial<this>);
  // }

  // public projectChildValues(values: readonly ColumnValue[]): ColumnValue[] { // TODO, move to compiled object
  //   return this.columnIndexes.map(i => values[i]);
  // }

  // public projectParentValues(values: readonly ColumnValue[]): ColumnValue[] { // TODO, move to compiled object
  //   return this.parentColumnIndexes.map(i => values[i]);
  // }
}

export function getReverseIndexFromName(name: string): string {
  return normalizeIdentifier(name);
}

export class CompiledForeignKey {
  constructor(
    public readonly fk: ForeignKey,
    public readonly columnIndexes: number[],
    public readonly parentColumnIndexes: number[],
  ) {}

  public projectChildValues(values: readonly ColumnValue[]): ColumnValue[] {
    return this.columnIndexes.map(i => values[i]);
  }

  public projectParentValues(values: readonly ColumnValue[]): ColumnValue[] {
    return this.parentColumnIndexes.map(i => values[i]);
  }

  public applyReferentialActionToRow(
    existingChildRow: ColumnValue[],
    replacementParentRow: readonly ColumnValue[] | undefined,
    action: ReferentialAction,
  ): ColumnValue[] {
    let next: ColumnValue[];
    switch (action) {
      case "restrict":
      case "noAction":
        return existingChildRow;
      case "setNull":
        next = [...existingChildRow];
        
        this.columnIndexes.forEach(idx => {
          next[idx] = null;
        });

        return next;
      case "cascade":
        if (!replacementParentRow) {
          throw new Error(
            "Replacement parent row required for CASCADE update"
          );
        }

        next = [...existingChildRow];

        this.columnIndexes.forEach((childIdx, i) => {         
          const parentIdx = this.parentColumnIndexes[i];
          next[childIdx] = replacementParentRow[parentIdx];
        });

        return next;
      default:
        throw new Error(`No Referential Action specified for foreign key.`);
    }
  }
}