import { normalizeIdentifier } from "../utils/normalizeIdentifier.js";
import { type ColumnKeyType } from "./Column.js";
import { ColumnBoundImmutable } from "./ColumnBoundImmutable.js";
import { type ForeignKeySpec } from "./Constraint.js";

export class ForeignKey extends ColumnBoundImmutable {

  protected constructor(
    public name: string,
    public columns: ColumnKeyType[],
    public parentTable: string,
    public parentColumns: ColumnKeyType[], 
  ) {
    super();
    this.validate();
    this.seal();
  }

  validate() {
    super.validateColumns();

    if(this.columns.length !== this.parentColumns.length) {
      throw new Error(`Child-Parent Columns length mismatch`);
    }
  }

  public static fromSpec(spec: ForeignKeySpec): ForeignKey {
    return new this(
      spec.name,
      spec.columns.map(normalizeIdentifier),
      normalizeIdentifier(spec.parentTable),
      spec.parentColumns.map(normalizeIdentifier),
    )
  }

  public rename(newName: string): ForeignKey {
    return this.with({
      name: newName
    } as Partial<this>);
  }

  public tryRenameParentColumn(
    parentTableName: string,
    oldColumnName: string,
    newColumnName: string
  ): this {
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
  ): this {
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
}
