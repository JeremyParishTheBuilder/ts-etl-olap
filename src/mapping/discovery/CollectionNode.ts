import { type ExpressionBuilder } from "../../dsl/expression/ExpressionBuilder.js";
import { PredicateBuilder } from "../../dsl/predicate/PredicateBuilder.js";
import { type CaptureContext } from "../value/CaptureContext.js";
import { Directory } from "./Directory.js";
import { type DiscoveryContext } from "./DiscoveryContext.js";
import { type DiscoveryNode } from "./DiscoveryNode.js";
import { DiscoveryResult } from "./DiscoveryResult.js";
import { type FsObject } from "./FsObject.js";

export interface CollectionNodeSepc {
  readonly matcher: PredicateBuilder<FsObject>,
  readonly children: readonly DiscoveryNode[],
  readonly nodeType: string,
  readonly captures?: Record<string, ExpressionBuilder<CaptureContext>>,
  readonly objectName?: string,
}

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
        !this.spec.matcher.evaluate(child)
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