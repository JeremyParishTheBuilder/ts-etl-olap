import { normalizeIdentifier } from "../utils/normalizeIdentifier.js";
import { Immutable } from "../infrastructure/Immutable.js";

interface ColumnBoundObject {
  readonly columns: string[];
  
  referencesColumn(name: string): boolean;
  tryRenameColumn(oldName: string, newName: string): this;
}

export abstract class ColumnBoundImmutable
  extends Immutable
  implements ColumnBoundObject
{
  abstract readonly name: string;
  abstract readonly columns: string[];

  public validateColumns(): void {
    if (this.columns.length === 0) {
      throw new Error("Constraint requires at least one column");
    }

    if (new Set(this.columns).size !== this.columns.length) {
      throw new Error("Duplicate column in constraint");
    }
  }

  public referencesColumn(name: string): boolean {
    return this.columns.includes(normalizeIdentifier(name));
  }

  public tryRenameColumn(oldName: string, newName: string): this {
    if (!this.referencesColumn(oldName)) {
      return this;
    }

    const normalizedOldName = normalizeIdentifier(oldName);
    const normalizedNewName = normalizeIdentifier(newName);

    return this.with({
      columns: this.columns.map(c => 
        c === normalizedOldName ? normalizedNewName : c
      )
    } as Partial<this>);
  }
}