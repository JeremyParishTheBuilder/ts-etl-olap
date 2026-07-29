import type { CaptureValue } from "../value/CaptureValue.js";

export interface CaptureContext {
  captures: ReadonlyMap<string, CaptureValue>;
}
