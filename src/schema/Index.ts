import { normalizeIdentifier } from "../utils/normalizeIdentifier.js";
import { type ColumnType, type ColumnValue } from "./Column.js";
import { ColumnBoundImmutable } from "./ColumnBoundImmutable.js";

export type IndexSpec = {
  name: string,
  columns: string[],
  unique?: boolean,
  ignoreRowAlive?: boolean;
  where?: (row: number) => boolean;
  nullsDistinct?: boolean;
};

export type IndexBuildInput = {
  rowCount: number;
  predicate: (rowNum: number) => boolean;
  getValues: (rowNum: number) => ColumnValue[];
};

export class Index extends ColumnBoundImmutable {
  public map: Map<string, number[]> = new Map();

  protected constructor(
    public name: string,
    public columns: string[],
    public unique?: boolean,
    public ignoreRowAlive?: boolean,
    public where?: (rowNum: number) => boolean,
    public nullsDistinct: boolean = true,
  ) {
    super();

    this.validate();
    this.seal();
  }

  validate() {
    super.validateColumns();
  }

  public static fromSpec(spec: IndexSpec): Index {
    return new this(
      spec.name,
      spec.columns.map(normalizeIdentifier),
      spec.unique,
      spec.ignoreRowAlive,
      spec.where,
      spec.nullsDistinct,
    );
  }

  public build(input: IndexBuildInput): Index {
    const { rowCount, predicate, getValues } = input;

    const map = new Map<string, number[]>();
    
    for (let rowNum = 0; rowNum < rowCount; rowNum++) {
      if (!predicate(rowNum)) continue;

      const values = getValues(rowNum);
      const key = this.getKeyFromValues(values);

      if (key === null && this.nullsDistinct) continue;

      const existing = map.get(key) ?? [];

      if (this.unique && existing.length > 0) {
        throw new Error(`Unique constraint violation`);
      }

      map.set(key, [...existing, rowNum]);
    }

    return this.with({
      map
    } as Partial<this>);
  }

  public rename(newName: string): Index {
    return this.with({
      name: newName
    } as Partial<this>);
  }

  public assertColumnNameUnreferenced(name: string): void {
    if (this.referencesColumn(name)) {
      throw new Error(`Column name ${name} referenced`);
    }
  }

  private assertUniqueFromValues(values: ColumnValue[]): void {
    if (values.includes(null) && this.nullsDistinct == true) return;
    
    const key = this.getKeyFromValues(values);

    if (this.map.has(key)) {
      throw new Error(`UNIQUE violation`);
    }
  }

  public addValues(values: ColumnValue[], rowNum: number): Index {
    if (this.unique) {
      this.assertUniqueFromValues(values);
    }

    const newMap = new Map(this.map);

    const key = this.getKeyFromValues(values);

    const rowNumsMappedToKey = newMap.get(key) ?? [];

    if (rowNumsMappedToKey.includes(rowNum)) {
      throw new Error(`Row ID already in Index`);
    }

    rowNumsMappedToKey.push(rowNum);
    newMap.set(key, rowNumsMappedToKey);

    return this.with({
      map: newMap,
    } as Partial<this>);
  }

  public removeValues(values: ColumnValue[], rowNum: number): Index {
    const key = this.getKeyFromValues(values);

    const newMap = new Map(this.map);

    const existing = newMap.get(key);

    if (!existing || !existing.includes(rowNum)) {
      throw new Error(`Existing Row ID not mapped to Key`);
    }

    const next = existing.filter(mappedRowNum => mappedRowNum !== rowNum);

    if (next.length === 0) {
      newMap.delete(key);
    } else {
      newMap.set(key, next);
    }

    return this.with({
      map: newMap,
    } as Partial<this>);
  }

  public updateValues(
    oldValues: ColumnValue[],
    newValues: ColumnValue[],
    rowNum: number
  ): Index {
    const SAME_VALUES: boolean =
      oldValues.length === newValues.length &&
      oldValues.every((v, i) => v === newValues[i]);

    if (SAME_VALUES) return this;
    
    return this.removeValues(oldValues, rowNum).addValues(newValues, rowNum);
  }

  private getKeyFromValues(keyValues: ColumnValue[]): string {
    return JSON.stringify(keyValues);
  }

  public hasValues(values: ColumnValue[]): boolean {
    return this.map.has(
      this.getKeyFromValues(values)
    );
  }
}

export function requiresIndexRebuild(oldType: ColumnType, newType: ColumnType): boolean {
  return true; // for now, alway rebuild on type change
}