import {
  type Expression,
} from './Expression.js';

export type ColumnType =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | "expression"
  | "function";

export type PrimitiveColumnValue = string | number | boolean | null;
export type ColumnValue = PrimitiveColumnValue;
// export type ColumnValue =
//   | PrimitiveColumnValue
//   | Expression
//   | { readonly f: (...args: any[]) => any };

import { Immutable } from "../infrastructure/Immutable.js";

type ColumnInput = ColumnSpec & {
  position: number;
};

export class Column extends Immutable {

  public name: string;
  public type: ColumnType;
  public nullable: boolean;
  public defaultValue?: ColumnValue;
  public enumValues?: readonly ColumnValue[];
  public autoIncrementStep?: number;
  public autoIncrementStart?: number;

  public position: number; //0-index

  public readonly data: ColumnValue[] = [];
  public readonly autoIncrementNext?: number;

  validate(): void {}

  private constructor(input: ColumnInput) {
    super();

    this.name = input.name;
    this.type = input.type;
    this.nullable = input.nullable ?? true;
    this.defaultValue = input.defaultValue;
    this.enumValues = input.enumValues;
    this.autoIncrementStep = input.autoIncrementStep;
    this.autoIncrementStart = input.autoIncrementStart;
    this.position = input.position;
    
    if (input.autoIncrementStep !== undefined) {
      this.autoIncrementNext = input.autoIncrementStart ?? 1;
    }

    this.validate();
    this.seal();
  }

  public static fromSpec(spec: ColumnSpec, position: number): Column {
    validateColumnSpec(spec);

    return new this({
      ...spec,
      position,
    });
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
    if (!datum) { throw new Error(`Value undefined.`); }
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
      this.autoIncrementNext !== undefined &&
      this.autoIncrementStep !== undefined &&
      datum === null
    ) {
      normalizedDatum = this.autoIncrementNext;
    }

    // maybe handle string to number type coercion later...

    this.assertDatumTypeMatchesColumnType(normalizedDatum);
    this.assertNullabilityConstraint(normalizedDatum);
    this.assertEnumValuesConstraint(normalizedDatum);

    return normalizedDatum; 
  }

  public addDatum(datum: ColumnValue): Column {
    let nextAutoIncrementNext = this.autoIncrementNext;
    
    if (datum === null && this.nullable === false) {
      throw new Error(`Cannot add null to not nullable column.`);
    }

    if (
      this.autoIncrementNext !== undefined &&
      this.autoIncrementStep !== undefined &&
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
    let nextAutoIncrementNext = this.autoIncrementNext;

    if (
      this.autoIncrementNext !== undefined &&
      this.autoIncrementStep !== undefined &&
      typeof datum === "number" &&
      datum >= this.autoIncrementNext
    ) {
      nextAutoIncrementNext = datum + this.autoIncrementStep;
    }
    
    const updatedData = [...this.data];
    updatedData[rowNum] = datum;

    return this.with({
      data: updatedData,
      autoIncrementNext: nextAutoIncrementNext,
    } as Partial<this>);
  }



  public setDatumAtRow(datum: ColumnValue, rowNum: number): Column {
    this.requireDatumAtRow(rowNum);

    this.assertDatumTypeMatchesColumnType(datum);
    this.assertNullabilityConstraint(datum);
    this.assertEnumValuesConstraint(datum);

    const newData: ColumnValue[] = [...this.data];
    newData[rowNum] = datum;

    return this.with({
      data: newData,
    } as Partial<this>);
  }

  public rename(newName: string): Column {
    return this.with({
      name: newName
    } as Partial<this>);
  }
}

export function isTypeCompatible(type1: ColumnType, type2: ColumnType): boolean {
  return type1 === type2;
}

function matchesColumnType(value: any, type: ColumnType): boolean {
  if (value === null) return true; // nullability handled separately

  switch (type) {
    case String:
      return typeof value === "string";
    case Number:
      return typeof value === "number" && !Number.isNaN(value);
    case Boolean:
      return typeof value === "boolean";
    case "expression":
      return typeof value === "object" && value !== null && "kind" in value;
    case "function":
      return typeof value === "object" && value !== null && typeof (value as any).fn === "function";
    default:
      return false;
  }
}

export type ColumnKeyType = string;

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
  references?: { table: string, column: string };
  check?: Expression;
};

export type ColumnShape = Omit<ColumnSpec, 'name'> & {
  autoIncrement?: {
    next?: number;  // must be reset on copy
    step: number;
  };
}

// export function cloneColumnValue(v: ColumnValue): ColumnValue {
//   if (v === null) return v;

//   // if (typeof v === "object") {
//   //   if ("f" in v) return v; // function wrapper reused

//   //   if (isExpression(v)) {
//   //     return cloneExpression(v);
//   //   }
//   // }

//   return v;
// }

function isExpression(v: unknown): v is Expression {
  return (
    typeof v === "object" &&
    v !== null &&
    "kind" in v &&
    typeof (v as any).kind === "string"
  );
}

//Column Utils
export function widens(oldType: ColumnType, newType: ColumnType): boolean {
  if (oldType === newType) return true;

  // primitive widening
  if (oldType === Number && newType === String) return true;
  if (oldType === Boolean && newType === String) return true;

  // special types
  //if (oldType === "expression" && newType === "function") return true;
  // etc...
  return false;
}

export function widenValue(newType: ColumnType, value: ColumnValue): ColumnValue {
  if (value === null) return null;  
  
  if (newType === String) return String(value);
  if (newType === Number) return Number(value);
  if (newType === Boolean) return Boolean(value);
  
  // expression/function passthrough
  //if (newType === "expression" || newType === "function") return value; //TODO

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

export function resolveDefault(column: Column): ColumnValue | undefined {
  return column.defaultValue;
}