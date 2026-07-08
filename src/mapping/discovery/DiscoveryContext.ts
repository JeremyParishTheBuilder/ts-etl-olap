import { type ColumnValue } from "../../types/ColumnValue.js";
import { type ImportRowIdentity } from "../import/ImportRowIdentity.js";
import { type FsObject } from "./FsObject.js";

export class DiscoveryContext {

  constructor(
    readonly current: FsObject,
    readonly scopeCaptures:
      ReadonlyMap<string, ColumnValue> = new Map(),
    readonly identity: ImportRowIdentity, // remove or keep?
  ) {}

  withCurrent(
    current: FsObject
  ): DiscoveryContext {
    return new DiscoveryContext(
      current,
      this.scopeCaptures,
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
        ...this.scopeCaptures,
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
      this.scopeCaptures,
      this.identity.append(...parts), 
    );
  }

  selectCaptures(
    names: readonly string[]
  ): Map<string, ColumnValue> {
    const result = new Map<string, ColumnValue>();

    for (const name of names) {
      if (
        this.scopeCaptures.get(name) !== undefined
      ) {
        result.set(
          name,
          this.scopeCaptures.get(name)!
        );
      }
    }

    return result;
  }
}