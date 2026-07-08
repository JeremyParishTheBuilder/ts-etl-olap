import { type ColumnValue } from "../../types/ColumnValue.js";
import { Directory } from "./Directory.js";
import { type DiscoveryContext } from "./DiscoveryContext.js";
import { type DiscoveryNode } from "./DiscoveryNode.js";
import { DiscoveryResult } from "./DiscoveryResult.js";
import { type FsObject } from "./FsObject.js";
import { FsObjectMatcher } from "./FsObjectMatcher.js";
import { TraversalMode } from "./TraversalMode.js";

export interface ScopeNodeSpec {
  readonly matcher: FsObjectMatcher,
  readonly traversalMode: TraversalMode,
  readonly children: readonly DiscoveryNode[],
  readonly nodeType: string,
  readonly captureName?: string,
  readonly captureResolver?: (directory: Directory) => ColumnValue,
  readonly objectName?: string,
}

export class ScopeNode implements DiscoveryNode {
  constructor(readonly spec: ScopeNodeSpec) {}

  discover(
    context: DiscoveryContext
  ): DiscoveryResult[] {

    const current = context.current;

    if (!(current instanceof Directory)) {
      return [];
    }

    const objectName = this.spec.objectName ?? this.spec.nodeType;

    const results: DiscoveryResult[] = [];

    let candidates: FsObject[];

    switch (this.spec.traversalMode) {

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

      if (!this.spec.matcher.matches(candidate)) {
        continue;
      }

      let candidateContext = context.withCurrent(candidate);

      if (this.spec.traversalMode === TraversalMode.Children) {
        candidateContext = candidateContext.withIdentityParts(
          [candidate.basename]
        );
      }

      if (this.spec.captureName) {
        const value = this.spec.captureResolver
          ? this.spec.captureResolver(candidate)
          : candidate.basename;

        candidateContext = candidateContext.withScopeCapture(
          this.spec.captureName,
          value
        );
      }

      if (
        this.spec.nodeType &&
        this.spec.captureName
      ) {
        results.push(
          new DiscoveryResult(
            this.spec.nodeType,
            candidateContext.identity,
            new Map(candidateContext.scopeCaptures),
            //this.spec.objectName // here
              //?
              new Map([
                  [
                    objectName,
                    candidate
                  ]
                ])
              //: new Map()
          )
        );
      }

      for (const childNode of this.spec.children) {
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