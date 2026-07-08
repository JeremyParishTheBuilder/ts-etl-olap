import { type ColumnValue } from "../../types/ColumnValue.js";
import { type ImportRowIdentity } from "../import/ImportRowIdentity.js";
import { type JsonValue } from "./JsonValue.js";

export interface ValueResolverContext {
  source: JsonValue;
  captures: ReadonlyMap<string, ColumnValue>;
  capture(name: string): ColumnValue;
  rowIdentity?: ImportRowIdentity;
}