import type Expression from './Expression.js';

export type ColumnType =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | "expression"
  | "function";

export type PrimitiveColumnValue = string | number | boolean | null;
export type ColumnValue = string | number | boolean | null | Expression | { f: (...args: any[]) => any };

export type IndexSpec = undefined;

export type Column = {
  name: string,
  type: ColumnType;

  //constraints
  nullable?: boolean;
  autoIncrement?: {
    next: number;
    step: number;
  };
  defaultValue?: ColumnValue | Expression;
  enumValues?: readonly ColumnValue[];
}

export type ColumnShape = Omit<Column, 'name'> & {
  autoIncrement?: {
    next?: number;  // must be reset on copy
    step: number;
  };
}

export type InlineColumnSpec = Omit<Column, 'name'> & {
  unique?: boolean;
  primaryKey?: boolean;
  references?: { table: string, column: string };
  check?: Expression;
};

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

export function resolveDefault(column: Column): ColumnValue | undefined {
  return column.defaultValue;
}