import { type ExpressionBuilder } from "../../dsl/expression/ExpressionBuilder.js";
import { toPascalCase } from "../../utils/format.js";
import { type CaptureContext } from "../discovery/CaptureContext.js";
import type { ImportSource } from "./ImportSource.js";

export interface ImportMappingSpec {
  readonly tableName?: string;
  readonly source?: ImportSource;
  readonly flatten?: boolean;
  readonly prefix?: string;
  readonly fields?: Record<string, ExpressionBuilder<CaptureContext>>;
  readonly children?: ImportMapping[];
}

export class ImportMapping {
  public tableName?: string;
  public source?: ImportSource;
  public flatten: boolean;
  public prefix?: string;
  public fields?: Record<string, ExpressionBuilder<CaptureContext>>;
  public children: ImportMapping[];

  constructor(readonly spec: ImportMappingSpec) {
    this.tableName = spec.tableName;// ?? "";
      // (spec.accepts
      //   ? toPascalCase(spec.accepts)
      //   : ""
      // )
    this.source = spec.source;
    this.flatten = spec.flatten ?? true;
    this.prefix = spec.prefix;
    this.fields = spec.fields;
    this.children = spec.children ?? [];
  }

}