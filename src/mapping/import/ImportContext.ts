import { type ColumnValue } from "../../types/ColumnValue.js";
import type { CaptureValue } from "../value/CaptureValue.js";
import { type ImportRowIdentity } from "./ImportRowIdentity.js";

export class ImportContext {
  constructor(
    readonly captures: Map<string, CaptureValue>,
    readonly identity: ImportRowIdentity
  ) {}

  withCapture(
    name: string,
    value: ColumnValue
  ): ImportContext {
    return new ImportContext(
      new Map([
        ...this.captures,
        [name, value]
      ]),
      this.identity
    );
  }

  withIdentity(
    identity: ImportRowIdentity
  ): ImportContext {
    return new ImportContext(
      this.captures,
      identity
    );
  }
}