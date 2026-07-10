import { type ColumnValue } from "../../types/ColumnValue.js";
import { type ImportRowIdentity } from "../import/ImportRowIdentity.js";
import { type CaptureContext } from "../value/CaptureContext.js";
import { type FsObject } from "./FsObject.js";

export class DiscoveryContext implements CaptureContext {

  constructor(
    readonly current: FsObject,
    readonly captures:
      ReadonlyMap<string, ColumnValue> = new Map(),
    readonly identity: ImportRowIdentity,
  ) {}

  withCurrent(
    current: FsObject
  ): DiscoveryContext {
    return new DiscoveryContext(
      current,
      this.captures,
      this.identity
    );
  }

  withScopeCapture(
    name: string,
    value: ColumnValue
  ): DiscoveryContext {
    return new DiscoveryContext(
      this.current,
      new Map([
        ...this.captures,
        [name, value]
      ]),
      this.identity
    );
  }

  withIdentityParts(
    parts: readonly ColumnValue[]
  ): DiscoveryContext {
    return new DiscoveryContext(
      this.current,
      this.captures,
      this.identity.append(...parts), 
    );
  }

  selectCaptures(
    names: readonly string[]
  ): Map<string, ColumnValue> {
    const result = new Map<string, ColumnValue>();

    for (const name of names) {
      if (
        this.captures.get(name) !== undefined
      ) {
        result.set(
          name,
          this.captures.get(name)!
        );
      }
    }

    return result;
  }
}