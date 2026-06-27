import { Directory } from "./Directory.js";
import { type DiscoveryContext } from "./DiscoveryContext.js";
import { type DiscoveryNode } from "./DiscoveryNode.js";
import { DiscoveryResult } from "./DiscoveryResult.js";
import { FsObjectMatcher } from "./FsObjectMatcher.js";

export class CollectionNode implements DiscoveryNode {
  constructor(
    readonly matcher: FsObjectMatcher,
    readonly children: DiscoveryNode[],
    readonly nodeType: string,
    readonly captureName: string,
    readonly objectName: string,
    readonly inheritedCaptures: string[] = [],
  ) {}

  discover(
    context: DiscoveryContext
  ): DiscoveryResult[] {

    const current =
      context.current;

    if (!(current instanceof Directory)) {
      return [];
    }

    const results: DiscoveryResult[] = [];

    const contents =
      current.contents ?? [];

    for (const child of contents) {

      if (!(child instanceof Directory)) {
        continue;
      }

      if (
        !this.matcher.matches(child)
      ) {
        continue;
      }

      const captures =
        context.selectCaptures(
          this.inheritedCaptures
        );

      captures.set(
        this.captureName,
        child.basename
      );

      results.push(
        new DiscoveryResult(
          this.nodeType,
          captures,
          new Map([
            [
              this.objectName,
              child
            ]
          ])
        )
      );

      const childContext =
        context.withCurrent(child);

      for (const node of this.children) {

        results.push(
          ...node.discover(
            childContext
          )
        );

      }

    }

    return results;

  }

}