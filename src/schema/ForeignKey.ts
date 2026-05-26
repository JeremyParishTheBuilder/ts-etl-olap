import { normalizeIdentifier } from "../utils/normalizeIdentifier.js";
import { ColumnValue } from "./Column.js";
import { ColumnBoundImmutable } from "./ColumnBoundImmutable.js";
import { type ForeignKeySpec } from "./Constraint.js";
import { ReferentialAction } from "./ReferentialAction.js";

export class ForeignKey extends ColumnBoundImmutable {

  protected constructor(
    public name: string,
    public columns: string[],
    public readonly columnIndexes: number[],
    public parentTable: string,
    public parentColumns: string[],
    public parentIndex: string,
    public reverseIndex: string,
    public onDelete: ReferentialAction = ReferentialAction.restrict,
    public onUpdate: ReferentialAction = ReferentialAction.restrict,
  ) {
    super();
    this.validate();
    this.seal();
  }

  validate() {
    super.validateColumns();

    if(this.columns.length !== this.columnIndexes.length) {
      throw new Error(`Child Column Name-Index length mismatch`);
    }

    if(this.columns.length !== this.parentColumns.length) {
      throw new Error(`Child-Parent Columns length mismatch`);
    }
  }

  public static create(
    spec: Omit<ForeignKeySpec, "kind"> & {
      columnIndexes: number[],
      parentIndex: string,
      onDelete?: ReferentialAction,
      onUpdate?: ReferentialAction,
    }): ForeignKey {
    return new this(
      spec.name,
      spec.columns.map(normalizeIdentifier),
      spec.columnIndexes,
      normalizeIdentifier(spec.parentTable),
      spec.parentColumns.map(normalizeIdentifier),
      normalizeIdentifier(spec.parentIndex),
      getReverseIndexFromName(spec.name),
      spec.onDelete,
      spec.onUpdate,
    );
  }

  public rename(newName: string): ForeignKey {
    return this.with({
      name: newName,
    } as Partial<this>);
  }

  public withReverseIndex(newName: string): ForeignKey {
    return this.with({
      reverseIndex: getReverseIndexFromName(newName),
    } as Partial<this>);
  }

  public withParentIndex(parentIndex: string): ForeignKey {
    return this.with({
      parentIndex: normalizeIdentifier(parentIndex),
    } as Partial<this>);
  }

  public tryRenameParentColumn(
    parentTableName: string,
    oldColumnName: string,
    newColumnName: string
  ): ForeignKey {
    if (normalizeIdentifier(parentTableName) !== this.parentTable) return this;

    const normalizedName = normalizeIdentifier(newColumnName);

    if (normalizeIdentifier(oldColumnName) === normalizedName) return this;

    if (!this.parentColumns.includes(normalizeIdentifier(oldColumnName))) {
      return this;
    }

    const newParentColumns = this.parentColumns.map(col =>
      col === normalizeIdentifier(oldColumnName) ? normalizedName : col
    );

    return this.with({
      parentColumns: newParentColumns,
    } as Partial<this>);
  }

  public tryRenameParentTable(
    oldParentTableName: string,
    newParentTableName: string
  ): ForeignKey {
    const normalizedName = normalizeIdentifier(newParentTableName);

    if (normalizeIdentifier(oldParentTableName) !== this.parentTable) {
      return this;
    }

    if (normalizeIdentifier(oldParentTableName) === normalizedName) {
      return this;
    }

    return this.with({
      parentTable: normalizedName,
    } as Partial<this>);
  }

  public tryUpdateColumnIndexes(columnNameToIndexMap: Map<string, number>): ForeignKey {
    const updatedColumnIndexes = [...this.columnIndexes];
    
    for (let i = 0; i < this.columns.length; i++) {
      updatedColumnIndexes[i] = columnNameToIndexMap.get(this.columns[i])!;
    }

    return this.with({
      columnIndexes: updatedColumnIndexes
    } as Partial<this>);
  }

  public getProjectedValues(values: readonly ColumnValue[]): ColumnValue[] {
    return this.columnIndexes.map(i => values[i]);
  }
}

function getReverseIndexFromName(name: string): string {
  return normalizeIdentifier(name);
}