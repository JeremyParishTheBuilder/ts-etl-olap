import { Directory } from "./Directory.js";
import { type DiscoveryContext } from "./DiscoveryContext.js";
import { type DiscoveryNode } from "./DiscoveryNode.js";
import { DiscoveryResult } from "./DiscoveryResult.js";
import { type FsObject } from "./FsObject.js";
import { FsObjectMatcher } from "./FsObjectMatcher.js";
import { TraversalMode } from "./TraversalMode.js";

export class ScopeNode implements DiscoveryNode {
  constructor(
    readonly matcher: FsObjectMatcher,
    readonly traversalMode: TraversalMode,
    readonly children: DiscoveryNode[],
    readonly nodeType?: string,
    readonly captureName?: string,
    readonly captureResolver?: (
      directory: Directory
    ) => unknown,
    readonly objectName?: string,
    readonly inheritedCaptures: string[] = [],
  ) {}

  discover(
    context: DiscoveryContext
  ): DiscoveryResult[] {

    const current = context.current;

    if (!(current instanceof Directory)) {
      return [];
    }

    const results: DiscoveryResult[] = [];

    let candidates: FsObject[];

    switch (this.traversalMode) {

      case TraversalMode.Self:
        candidates = [current];
        break;

      case TraversalMode.Children:
        candidates = current.contents ?? [];
        break;

      default: candidates = [];
    }

    for (const candidate of candidates) {

      if (!(candidate instanceof Directory)) {
        continue;
      }

      if (!this.matcher.matches(candidate)) {
        continue;
      }

      let candidateContext =
        context.withCurrent(candidate);

      let value: unknown;

      if (this.captureName) {

        value =
          this.captureResolver
            ? this.captureResolver(candidate)
            : candidate.basename;

        candidateContext =
          candidateContext.withScopeCapture(
            this.captureName,
            value
          );

      }

      if (
        this.nodeType &&
        this.captureName
      ) {

        const captures =
          context.selectCaptures(
            this.inheritedCaptures
          );

        captures.set(
          this.captureName,
          value
        );

        results.push(
          new DiscoveryResult(
            this.nodeType,
            captures,
            this.objectName
              ? new Map([
                  [
                    this.objectName,
                    candidate
                  ]
                ])
              : new Map()
          )
        );

      }

      for (const childNode of this.children) {

        results.push(
          ...childNode.discover(
            candidateContext
          )
        );

      }

    }

    return results;

  }

}