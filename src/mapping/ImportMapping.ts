import { type DerivedField } from "./DerivedField.js";
import { type ImportSourceResolver } from "./ImportSourceResolver.js";

export class ImportMapping {
  constructor(
    readonly tableName: string,
    readonly sourceResolver: ImportSourceResolver,
    readonly prefix = "",
    readonly derivedFields: DerivedField[] = [],
    readonly captures: DerivedField[] = [],
    readonly nestedMappings: ImportMapping[] = [],
  ) {}
}