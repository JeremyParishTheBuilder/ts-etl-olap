import { type ColumnValue } from "../../types/ColumnValue.js";
import { type ImportRowIdentity } from "../import/ImportRowIdentity.js";
import type { CaptureValue } from "./CaptureValue.js";
import { type JsonValue } from "./json/JsonValue.js";

export interface ValueResolverContext {
  source: JsonValue;
  //captures: ReadonlyMap<string, ColumnValue>;
  captures: ReadonlyMap<string, CaptureValue>;
  capture(name: string): CaptureValue;
  rowIdentity?: ImportRowIdentity;
}