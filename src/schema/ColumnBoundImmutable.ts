//import { normalizeIdentifier } from "../utils/normalizeIdentifier.js";
import { Immutable } from "../infrastructure/Immutable.js";
import { type ColumnId } from "./Column.js";

interface ColumnBoundObject {
  //readonly columns: string[];
  readonly columns: ColumnId[];
  
  referencesColumn(id: ColumnId): boolean;
  //tryRenameColumn(oldName: string, newName: string): this;
}

export abstract class ColumnBoundImmutable
  extends Immutable
  implements ColumnBoundObject
{
  abstract readonly name: string;
  abstract readonly columns: ColumnId[];

  public validateColumns(): void {
    if (this.columns.length === 0) {
      throw new Error("Constraint requires at least one column");
    }

    if (new Set(this.columns).size !== this.columns.length) {
      throw new Error("Duplicate column in constraint");
    }
  }

  public referencesColumn(id: ColumnId): boolean {
    //return this.columns.includes(normalizeIdentifier(name));
    return this.columns.includes(id);
  }

  // public tryRenameColumn(oldName: string, newName: string): this {
  //   if (!this.referencesColumn(oldName)) {
  //     return this;
  //   }

  //   const normalizedOldName = normalizeIdentifier(oldName);
  //   const normalizedNewName = normalizeIdentifier(newName);

  //   return this.with({
  //     columns: this.columns.map(c => 
  //       c === normalizedOldName ? normalizedNewName : c
  //     )
  //   } as Partial<this>);
  // }
}