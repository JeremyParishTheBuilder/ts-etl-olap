import { Predicate } from "../query/predicate/Predicate.js";
import { normalizeIdentifier } from "../utils/normalizeIdentifier.js";
import { type ColumnType, type ColumnValue } from "./Column.js";
import { ColumnBoundImmutable } from "./ColumnBoundImmutable.js";
import { RowView } from "./RowView.js";

export type IndexSpec = {
  name: string,
  columns: string[],
  unique?: boolean,
  nullsDistinct?: boolean;
  predicate?: Predicate;//(row: number) => boolean;
};

export class Index extends ColumnBoundImmutable {
  public map: Map<string, number[]> = new Map();

  protected constructor(
    public name: string,
    public columns: string[],
    public readonly columnIndexes: number[],
    public unique?: boolean,
    public nullsDistinct: boolean = true,
    public predicate?: Predicate,//(rowNum: number) => boolean,
    public ownerConstraint?: string,
  ) {
    super();

    this.validate();
    this.seal();
  }

  validate() {
    super.validateColumns();
  }

  public static create(spec: IndexSpec & {columnIndexes: number[], ownerConstraint?: string}): Index {
    return new this(
      spec.name,
      spec.columns.map(normalizeIdentifier),
      spec.columnIndexes,
      spec.unique,
      spec.nullsDistinct,
      spec.predicate,
      spec.ownerConstraint,
    );
  }

  public build(rows: Iterable<RowView>): Index {
    const map = new Map<string, number[]>();
    
    for (const row of rows) {
      if (!this.matches(row)) continue;

      const key = this.getKeyFromRow(row);

      if (key === null && this.nullsDistinct) continue;

      const existing = map.get(key) ?? [];

      if (this.unique && existing.length > 0) {
        throw new Error(`Unique constraint violation`);
      }

      map.set(key, [...existing, row.index]);
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

  public withOwnerConstraint(ownerConstraint: string): Index {
    return this.with({
      ownerConstraint: normalizeIdentifier(ownerConstraint),
    } as Partial<this>);
  }

  private matches(row: RowView): boolean {
    return this.predicate
      ? this.predicate.evaluate(row)
      : true;
  }

  public assertColumnNameUnreferenced(name: string): void {
    if (this.referencesColumn(name)) {
      throw new Error(`Column name ${name} referenced`);
    }
  }

  private assertUniqueFromRow(row: RowView): void {
    if (row.values.includes(null) && this.nullsDistinct == true) return;
    
    const key = this.getKeyFromRow(row);

    if (this.map.has(key)) {
      throw new Error(`UNIQUE violation ${row.values}`);
    }
  }

  public tryAddRow(row: RowView): Index {
    if (!this.matches(row)) return this;

    const key = this.getKeyFromRow(row);

    if (this.unique) {
      this.assertUniqueFromRow(row);
    }

    const newMap = new Map(this.map);

    const rowNumsMappedToKey = newMap.get(key) ?? [];

    if (rowNumsMappedToKey.includes(row.index)) {
      throw new Error(`Row ID already in Index`);
    }

    rowNumsMappedToKey.push(row.index);

    newMap.set(key, rowNumsMappedToKey);

    return this.with({
      map: newMap,
    } as Partial<this>);
  }

  public tryRemoveRow(row: RowView): Index {
    if (!this.matches(row)) return this;

    const key = this.getKeyFromRow(row);

    const newMap = new Map(this.map);

    const existing = newMap.get(key);

    const rowNum = row.index;

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

  public tryUpdateRow(
    oldRow: RowView,
    newRow: RowView,
  ): Index {
    if (
      !this.matches(oldRow) &&
      !this.matches(newRow)
    ) return this;

    if (oldRow.index !== newRow.index) {
      throw new Error(`Mistmatching row indexes`);
    }

    const oldValues = oldRow.values;
    const newValues = newRow.values;

    const SAME_VALUES: boolean =
      oldValues.length === newValues.length &&
      oldValues.every((v, i) => v === newValues[i]);

    if (SAME_VALUES) return this;

    return this.tryRemoveRow(oldRow).tryAddRow(newRow);
  }

  public tryUpdateColumnIndexes(columnNameToIndexMap: Map<string, number>): Index {
    const updatedColumnIndexes = [...this.columnIndexes];
    
    for (let i = 0; i < this.columns.length; i++) {
      updatedColumnIndexes[i] = columnNameToIndexMap.get(this.columns[i])!;
    }

    return this.with({
      columnIndexes: updatedColumnIndexes
    } as Partial<this>);
  }

  private getKeyFromProjection(projection: readonly ColumnValue[]): string {
    return JSON.stringify(projection);
  }

  private getKeyFromRow(row: RowView): string {
    return this.getKeyFromProjection(
      this.getProjectedValues(row.values)
    );
  }

  public getProjectedValues(values: readonly ColumnValue[]): ColumnValue[] {
    return this.columnIndexes.map(i => values[i]);
  }

  public hasProjectedValues(projection: readonly ColumnValue[]): boolean {
    return this.map.has(
      this.getKeyFromProjection(projection)
    );
  }

  public hasRow(values: readonly ColumnValue[]): boolean {
    return this.map.has(
      this.getKeyFromProjection(
        this.getProjectedValues(values)
      )
    );
  }

  public getRowNumsFromProjection(projection: readonly ColumnValue[]): number[] | undefined {
    return this.map.get(
      this.getKeyFromProjection(projection)
    )
  }
}

export function requiresIndexRebuild(oldType: ColumnType, newType: ColumnType): boolean {
  return true; // for now, alway rebuild on type change
}