import { Immutable } from "../infrastructure/Immutable.js";
import { normalizeIdentifier } from "../utils/normalizeIdentifier.js";
import { type ColumnId } from "./Column.js";
import { ColumnBoundImmutable } from "./ColumnBoundImmutable.js";
import { type PrimaryKeySpec } from "./Constraint.js";
import { type IndexId } from "./Index.js";

export class PrimaryKey extends Immutable {
  protected constructor(
    public name: string,
    public index: IndexId,
  ) {
    super();
    this.validate();
    this.seal();
  }
  validate(): void {}

  public static create(spec: {
    name: string,
    index: IndexId
  }): PrimaryKey {
    return new this(
      spec.name,
      spec.index,
    )
  }

  public rename(newName: string): PrimaryKey {
    return this.with({
      name: newName
    } as Partial<this>);
  }

  public static defaultIndexName(name: string): string {
    return name.concat("_PKIDX");
  }
}