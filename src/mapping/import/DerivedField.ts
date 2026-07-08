import { type ColumnValue } from "../../types/ColumnValue.js";
import { type ValueResolver } from "../value/ValueResolver.js";

export class DerivedField {
  constructor(
    readonly columnName: string,
    readonly sourceResolver: ValueResolver<ColumnValue>,
  ) {}
}