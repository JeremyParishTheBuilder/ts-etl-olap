import { type ExpressionBuilder } from "../../dsl/expression/ExpressionBuilder.js";
import { pathToPascalCase } from "../../utils/format.js";
import { type CaptureContext } from "../discovery/CaptureContext.js";
import { type ImportSource } from "./ImportSource.js";

export class ImportMapping {
  public accepts?: string; 
  public tableName: string;
  public source: ImportSource;
  public prefix?: string;
  public fields?: Record<string, ExpressionBuilder<CaptureContext>>;
  public captures?: Record<string, ExpressionBuilder<CaptureContext>>;
  public children: ImportMapping[];

  constructor(readonly spec: { 
    accepts?: string,
    tableName?: string,
    source: ImportSource,
    prefix?: string,
    fields?: Record<string, ExpressionBuilder<CaptureContext>>,
    captures?: Record<string, ExpressionBuilder<CaptureContext>>,
    children?: ImportMapping[],
  }) {
    this.accepts = spec.accepts;
    this.tableName = spec.tableName ??
      ImportMapping.inferTableName(spec.source);
    this.source = spec.source;
    this.prefix = spec.prefix;
    this.fields = spec.fields;
    this.captures = spec.captures;
    this.children = spec.children ?? [];
  }

  static inferTableName(
    source: ImportSource
  ): string {
    return pathToPascalCase(source.identityParts());
  }
}