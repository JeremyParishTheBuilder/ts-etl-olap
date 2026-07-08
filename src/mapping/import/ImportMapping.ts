import { pathToPascalCase } from "../../utils/format.js";
import { type DerivedField } from "./DerivedField.js";
import { type ImportSourceResolver } from "./ImportSourceResolver.js";

export class ImportMapping {
  public tableName: string;
  public sourceResolver: ImportSourceResolver;
  public prefix?: string;
  public derivedFields: DerivedField[];
  public captures: DerivedField[];
  public nestedMappings: ImportMapping[];

  constructor(readonly spec: { 
    tableName?: string,
    sourceResolver: ImportSourceResolver,
    prefix?: string,
    derivedFields?: DerivedField[],
    captures?: DerivedField[],
    nestedMappings?: ImportMapping[],
  }) {
    this.tableName = spec.tableName ??
      ImportMapping.inferTableName(spec.sourceResolver);
    this.sourceResolver = spec.sourceResolver;
    this.prefix = spec.prefix;
    this.derivedFields = spec.derivedFields ?? [];
    this.captures = spec.captures ?? [];
    this.nestedMappings = spec.nestedMappings ?? [];
  }

  static inferTableName(
    resolver: ImportSourceResolver
  ): string {
    return pathToPascalCase(resolver.identityParts());
  }
}