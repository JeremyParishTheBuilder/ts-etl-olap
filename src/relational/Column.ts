import { Immutable } from "../infrastructure/Immutable.js";
import { type ReferentialAction } from './ReferentialAction.js';
import { type ExplicitInput } from '../types/ExplicitInput.js';
import { type PredicateNode } from "../semantic/ast/predicate/PredicateNode.js";
import { type ColumnValue } from "../types/ColumnValue.js";
import { type ColumnType, matchesColumnType } from "../types/ColumnType.js";

export type ColumnId = number & { readonly __brand: "ColumnId" };

export class Column extends Immutable {

  public readonly name: string;
  public readonly type: ColumnType;
  public readonly nullable: boolean;
  public readonly defaultValue?: ColumnValue;
  public readonly enumValues?: readonly ColumnValue[];
  public readonly autoIncrementStep?: number;
  public readonly autoIncrementStart?: number;

  public readonly id: ColumnId;
  public readonly position: number; //0-index

  public readonly data: ColumnValue[];
  public readonly autoIncrementNext?: number;

  validate(): void {}

  private constructor(spec:
    ColumnSpec & {
    id: ColumnId,
    position: number,
  }) {
    super();

    this.name = spec.name;
    this.type = spec.type;
    this.nullable = spec.nullable ?? true;
    this.defaultValue = spec.defaultValue;
    this.enumValues = spec.enumValues;
    this.autoIncrementStep = spec.autoIncrementStep;
    this.autoIncrementStart = spec.autoIncrementStart;

    this.id = spec.id;
    this.position = spec.position;
    if (this.autoIncrementStep !== undefined) {
      this.autoIncrementNext = this.autoIncrementStart ?? 1;
    }
    this.data = [];

    this.validate();
    this.seal();
  }

  public static create(spec:
    ColumnSpec & {
    id: ColumnId,
    position: number
  }): Column {
    validateColumnSpec(spec);

    return new this(spec);
  }

  public alter(newType: ColumnType): Column {
    const oldType = this.type;

    if(oldType === newType) {
      throw new Error(`Column types already identical`);
    }
    
    if (!widens(oldType, newType)) {
      throw new Error(
        `Cannot alter column ${this.name}:
        ${oldType} cannot convert to ${newType}`
      );
    }

    const newSpec: ColumnSpec = {...this, type: newType};
    validateColumnSpec(newSpec);

    const widenedData: ColumnValue[] = this.data.map(value =>
      widenValue(newType, value)
    );
    
    return this.with({
      type: newType,
      data: widenedData,
    } as Partial<this>);
  }

  public tryDecrementPosition(position: number): this {
    if (this.position === undefined) {
      throw new Error(`Column does not have position`);
    }

    if (this.position < position) return this;

    return this.with({
      position: this.position - 1,
    } as Partial<this>);
  }

  public getDatumAtRow(rowNum: number): ColumnValue | undefined {
    return this.data[rowNum];
  }

  public requireDatumAtRow(rowNum: number): ColumnValue {
    const datum = this.getDatumAtRow(rowNum);
    if (datum === undefined) { throw new Error(`Value undefined.`); }
    return datum;
  }

  private assertDatumTypeMatchesColumnType(datum: ColumnValue): void {
    if (!matchesColumnType(datum, this.type)) {
      throw new Error(`Value type does not match Column Type.`);
    }
  }

  private assertNullabilityConstraint(value: ColumnValue): void {
    if (this.nullable === false && value === null) {
      throw new Error(`Column '${this.name}' cannot have NULL value`);
    }
  }

  private assertEnumValuesConstraint(value: ColumnValue): void {
    if (this.enumValues && !this.enumValues.includes(value)) {
      throw new Error(`Column '${this.name}' value must be in enum values`);
    }
  }

  public normalizeDatum(datum: ColumnValue, mode: "insert" | "update"): ColumnValue {
    let normalizedDatum = datum;
    
    if (
      mode === "insert" &&
      datum === null &&
      this.isAutoIncrement()
    ) {
      normalizedDatum = this.autoIncrementNext;
    }

    // maybe handle string to number type coercion later...

    this.assertDatumTypeMatchesColumnType(normalizedDatum);
    this.assertNullabilityConstraint(normalizedDatum);
    this.assertEnumValuesConstraint(normalizedDatum);

    return normalizedDatum; 
  }

  private resolveDefaultOrThrow(mode: "insert" | "update"): ColumnValue {
    if (this.defaultValue !== undefined) return this.defaultValue;
    else if (this.isAutoIncrement() && mode === "insert") {
      return this.autoIncrementNext;
    }
    else if (this.nullable) return null;
    else {
      throw new Error(`Cannot resolve default the Column ${this.name}`);
    }
  }

  public resolveInput(
    input: ExplicitInput | undefined,
    mode: "insert" | "update",
  ): ColumnValue {
    if (input === undefined) {
      return this.resolveDefaultOrThrow(mode);
    }

    if (typeof input === "symbol") {
      throw new Error("Keyword must be resolved at Table level");
    }

    return input;
  }

  public assertDatum(datum: ColumnValue): void {
    this.assertDatumTypeMatchesColumnType(datum);
    this.assertNullabilityConstraint(datum);
    this.assertEnumValuesConstraint(datum);
  }

  isAutoIncrement(): this is this & {
    autoIncrementStep: number;
    autoIncrementNext: number;
  } {
    return  this.autoIncrementStep !== undefined &&
            this.autoIncrementNext !== undefined;
  }

  public addDatum(datum: ColumnValue): Column {
    this.assertDatum(datum);

    let nextAutoIncrementNext = this.autoIncrementNext;
    if (
      this.isAutoIncrement() &&
      typeof datum === "number" &&
      datum >= this.autoIncrementNext
    ) {
      nextAutoIncrementNext = datum + this.autoIncrementStep;
    }

    return this.with({
      data: [...this.data, datum],
      autoIncrementNext: nextAutoIncrementNext,
    } as Partial<this>);
  }

  public updateDatum(datum: ColumnValue, rowNum: number): Column {
    this.requireDatumAtRow(rowNum);

    this.assertDatum(datum);
    
    const updatedData = [...this.data];
    updatedData[rowNum] = datum;

    return this.with({
      data: updatedData,
    } as Partial<this>);
  }

  public rename(newName: string): Column {
    return this.with({
      name: newName
    } as Partial<this>);
  }
}

export type ColumnSpec = {
  name: string;
  type: ColumnType;
  nullable?: boolean;
  defaultValue?: ColumnValue;
  enumValues?: readonly ColumnValue[];
  autoIncrementStep?: number;
  autoIncrementStart?: number;
};

export function validateColumnSpec(spec: ColumnSpec): void {
  if (spec.autoIncrementStep !== undefined && spec.type !== Number) {
    throw new Error(`Column: "${spec.name}" can only autoIncrement as type Number.`);
  }
}

export type InlineColumnSpec = Omit<ColumnSpec, 'name'> & {
  unique?: boolean;
  primaryKey?: boolean;
  references?: {
    table: string,
    column: string,
    onDelete?: ReferentialAction,
    onUpdate?: ReferentialAction,
  };
  check?: PredicateNode;
};

export type ColumnShape = Omit<ColumnSpec, 'name'> & {
  autoIncrement?: {
    next?: number;  // must be reset on copy
    step: number;
  };
}

//Column Utils
export function widens(oldType: ColumnType, newType: ColumnType): boolean {
  if (oldType === newType) return true;

  // primitive widening
  if (oldType === Number && newType === String) return true;
  if (oldType === Boolean && newType === String) return true;

  return false;
}

export function widenValue(newType: ColumnType, value: ColumnValue): ColumnValue {
  if (value === null) return null;  
  
  if (newType === String) return String(value);
  if (newType === Number) return Number(value);
  if (newType === Boolean) return Boolean(value);

  return value; // default, or throw
}

export function canBeIndexed(type: ColumnType): boolean {
  return type === Number || type === String || type === Boolean;
}

export function assertTypeIndexable(type: ColumnType): void {
  if (!canBeIndexed(type)) {
    throw new Error(`Type ${type} cannot is not Indexable`);
  }
}