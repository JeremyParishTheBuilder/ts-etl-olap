import { type DerivedValueResolver } from "./DerivedValueResolver.js";

export class DerivedField {
  constructor(
    readonly columnName: string,
    readonly sourceResolver: DerivedValueResolver,
  ) {}
}