import { type ColumnValue } from "../../types/ColumnValue.js";

export class ImportRowIdentity {
  private constructor(
    readonly parts: readonly ColumnValue[],
  ) {}

  static empty(): ImportRowIdentity {
    return new ImportRowIdentity([]);
  }

  append(...parts: readonly ColumnValue[]): ImportRowIdentity {
    return new ImportRowIdentity([
      ...this.parts,
      ...parts,
    ]);
  }

  appendIdentity(identity: ImportRowIdentity): ImportRowIdentity {
    return new ImportRowIdentity([
      ...this.parts,
      ...identity.parts,
    ]);
  }

  static from(parts: readonly ColumnValue[]): ImportRowIdentity {
    return new ImportRowIdentity(parts);
  }

  toString(): string {
    return JSON.stringify(this.parts);
  }
}