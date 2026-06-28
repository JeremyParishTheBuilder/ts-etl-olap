import { type ValueResolver } from "./ValueResolver.js";

export class DerivedField {
  constructor(
    readonly columnName: string,
    readonly sourceResolver: ValueResolver,
  ) {}
}