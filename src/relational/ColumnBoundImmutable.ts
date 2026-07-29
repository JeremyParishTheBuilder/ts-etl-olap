import { Immutable } from "../infrastructure/Immutable.js";
import { type ColumnId } from "./Column.js";

interface ColumnBoundObject {
  readonly columns: ColumnId[];

  referencesColumn(id: ColumnId): boolean;
}

export abstract class ColumnBoundImmutable
  extends Immutable
  implements ColumnBoundObject
{
  abstract readonly name: string;
  abstract readonly columns: ColumnId[];

  public validateColumns(): void {
    if (new Set(this.columns).size !== this.columns.length) {
      throw new Error("Duplicate column in constraint");
    }
  }

  public referencesColumn(id: ColumnId): boolean {
    return this.columns.includes(id);
  }
}
