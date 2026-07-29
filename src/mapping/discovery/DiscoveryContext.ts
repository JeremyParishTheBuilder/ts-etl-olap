import { type ColumnValue } from "../../types/ColumnValue.js";
import { type CaptureContext } from "./CaptureContext.js";
import type { DiscoveryValue } from "../value/DiscoveryValue.js";
import type { CaptureValue } from "../value/CaptureValue.js";
import type { DiscoveryIdentity } from "./DiscoveryIdentity.js";
import type { DiscoveryResult } from "./DiscoveryResult.js";

export class DiscoveryContext implements CaptureContext {
  constructor(
    readonly current: DiscoveryValue,
    readonly captures: ReadonlyMap<string, CaptureValue> = new Map(),
    readonly identity: DiscoveryIdentity,
    readonly result?: DiscoveryResult,
  ) {}

  withCurrent(current: DiscoveryValue): DiscoveryContext {
    return new DiscoveryContext(
      current,
      this.captures,
      this.identity,
      this.result,
    );
  }

  withCapture(name: string, value: CaptureValue): DiscoveryContext {
    return new DiscoveryContext(
      this.current,
      new Map([...this.captures, [name, value]]),
      this.identity,
      this.result,
    );
  }

  withIdentityParts(parts: readonly ColumnValue[]): DiscoveryContext {
    return new DiscoveryContext(
      this.current,
      this.captures,
      this.identity.append(...parts),
      this.result,
    );
  }

  // TODO this is unused, maybe remoove result from DiscoveryResult.
  withResult(result: DiscoveryResult): DiscoveryContext {
    return new DiscoveryContext(
      this.current,
      this.captures,
      this.identity,
      result,
    );
  }

  selectCaptures(names: readonly string[]): Map<string, CaptureValue> {
    const result = new Map<string, CaptureValue>();

    for (const name of names) {
      if (this.captures.get(name) !== undefined) {
        result.set(name, this.captures.get(name)!);
      }
    }

    return result;
  }
}
