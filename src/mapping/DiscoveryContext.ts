import { type FsObject } from "./FsObject.js";

export class DiscoveryContext {

  constructor(
    readonly current: FsObject,
    readonly scopeCaptures:
      ReadonlyMap<string, unknown> = new Map(),
  ) {}

  withCurrent(
    current: FsObject
  ): DiscoveryContext {

    return new DiscoveryContext(
      current,
      this.scopeCaptures
    );

  }

  withScopeCapture(
    name: string,
    value: unknown
  ): DiscoveryContext {

    return new DiscoveryContext(
      this.current,
      new Map([
        ...this.scopeCaptures,
        [name, value]
      ])
    );

  }

  selectCaptures(
    names: string[]
  ): Map<string, unknown> {

    const result =
      new Map<string, unknown>();

    for (const name of names) {

      if (
        this.scopeCaptures.has(name)
      ) {
        result.set(
          name,
          this.scopeCaptures.get(name)
        );
      }

    }

    return result;

  }

}