import { type ExpressionBuilder } from "../../dsl/expression/ExpressionBuilder.js";
import { pathToPascalCase } from "../../utils/format.js";
//import { type Capture } from "../value/Capture.js";
import { type CaptureContext } from "../value/CaptureContext.js";
//import { type DerivedField } from "../value/DerivedField.js";
import { type ValueResolverContext } from "../value/ValueResolverContext.js";
import { type ImportSource } from "./ImportSource.js";

export class ImportMapping {
  public tableName: string;
  public sourceResolver: ImportSource;
  public prefix?: string;
  //public derivedFields: DerivedField[];
  public fields?: Record<string, ExpressionBuilder<CaptureContext>>;
  //public captures: Capture<ValueResolverContext>[];
  public captures?: Record<string, ExpressionBuilder<CaptureContext>>;
  public nestedMappings: ImportMapping[];

  constructor(readonly spec: { 
    tableName?: string,
    sourceResolver: ImportSource,
    prefix?: string,
    fields?: Record<string, ExpressionBuilder<CaptureContext>>,
    //captures?: Capture<ValueResolverContext>[]
    captures?: Record<string, ExpressionBuilder<CaptureContext>>,
    nestedMappings?: ImportMapping[],
  }) {
    this.tableName = spec.tableName ??
      ImportMapping.inferTableName(spec.sourceResolver);
    this.sourceResolver = spec.sourceResolver;
    this.prefix = spec.prefix;
    this.fields = spec.fields;// ?? [];
    //this.captures = spec.captures ?? [];
    this.captures = spec.captures;
    this.nestedMappings = spec.nestedMappings ?? [];
  }

  static inferTableName(
    source: ImportSource
  ): string {
    return pathToPascalCase(source.identityParts());
  }
}