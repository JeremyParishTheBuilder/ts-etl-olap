import { normalizeIdentifier } from "../utils/normalizeIdentifier.js";
import { ColumnBoundImmutable } from "./ColumnBoundImmutable.js";
import { type PrimaryKeySpec } from "./Constraint.js";

export class PrimaryKey extends ColumnBoundImmutable {
  protected constructor(
    public name: string,
    public columns: string[],
    public index: string,
  ) {
    super();
    this.validate();
    this.seal();
  }
  validate() {
    super.validateColumns();
  }

  public static fromSpec(spec: PrimaryKeySpec): PrimaryKey {
    return new this(
      spec.name,
      spec.columns.map(normalizeIdentifier),
      normalizeIdentifier(spec.index ?? spec.name),
    )
  }

  public rename(newName: string): PrimaryKey {
    return this.with({
      name: newName
    } as Partial<this>);
  }

  public renameIndex(newIndexName: string): PrimaryKey {
    return this.with({
      index: normalizeIdentifier(newIndexName),
    } as Partial<this>);
  }
}