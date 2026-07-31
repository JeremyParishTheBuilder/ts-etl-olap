import { type ImportRowIdentity } from "../import/ImportRowIdentity.js";
import type { CaptureValue } from "./CaptureValue.js";
import type { StructuredValue } from "./StructuredValue.js";

export interface ValueResolverContext {
  current: StructuredValue;
  captures: ReadonlyMap<string, CaptureValue>;
  capture(name: string): CaptureValue;
  rowIdentity?: ImportRowIdentity;
}
