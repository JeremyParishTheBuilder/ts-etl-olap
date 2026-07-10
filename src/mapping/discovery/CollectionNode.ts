import { type ExpressionBuilder } from "../../dsl/expression/ExpressionBuilder.js";
//import { Capture } from "../value/Capture.js";
import { type CaptureContext } from "../value/CaptureContext.js";
import { Directory } from "./Directory.js";
import { type DiscoveryContext } from "./DiscoveryContext.js";
import { type DiscoveryNode } from "./DiscoveryNode.js";
import { DiscoveryResult } from "./DiscoveryResult.js";
import { FsObjectMatcher } from "./FsObjectMatcher.js";

export interface CollectionNodeSepc {
  readonly matcher: FsObjectMatcher,
  readonly children: readonly DiscoveryNode[],
  readonly nodeType: string,
  //readonly captures?: readonly Capture<DiscoveryContext>[]
  readonly captures?: Record<string, ExpressionBuilder<CaptureContext>>,
  readonly objectName?: string,
}

//for (const [name, builder] of Object.entries(mapping.captures?? {})) {

export class CollectionNode implements DiscoveryNode {
  constructor(readonly spec: CollectionNodeSepc) {}

  discover(
    context: DiscoveryContext
  ): DiscoveryResult[] {
    const current =
      context.current;

    if (!(current instanceof Directory)) {
      return [];
    }

    const results: DiscoveryResult[] = [];

    const contents = current.contents ?? [];

    const objectName = this.spec.objectName ?? this.spec.nodeType;

    for (const child of contents) {
      if (!(child instanceof Directory)) {
        continue;
      }

      if (
        !this.spec.matcher.matches(child)
      ) {
        continue;
      }

      let childContext = context
        .withCurrent(child)
        .withIdentityParts([child.basename]);

      for (const [name, builder] of Object.entries(this.spec.captures?? {})) {
        childContext =
          childContext.withScopeCapture(
            name,
            builder.evaluate(childContext)
          );
      }

      // childContext = childContext
      //   .withScopeCapture(
      //     this.spec.captureName,
      //     child.basename
      //   );

      results.push(
        new DiscoveryResult(
          this.spec.nodeType,
          childContext.identity,
          new Map(childContext.captures),
          new Map([
            [
              objectName,
              child
            ]
          ])
        )
      );

      for (const node of this.spec.children) {
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