import { type ExpressionBuilder } from "../../dsl/expression/ExpressionBuilder.js";
//import { type Capture } from "../value/Capture.js";
import { type CaptureContext } from "../value/CaptureContext.js";
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
  //readonly captures?: readonly Capture<DiscoveryContext>[]
  readonly captures?: Record<string, ExpressionBuilder<CaptureContext>>,
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

      for (const [name, builder] of Object.entries(this.spec.captures?? {})) {
      //for (const capture of this.spec.captures ?? []) {
        candidateContext =
          candidateContext.withScopeCapture(
            name,
            builder.evaluate(candidateContext)
          );
      }

      if (
        this.spec.nodeType// &&
        //this.spec.captureName
      ) {
        results.push(
          new DiscoveryResult(
            this.spec.nodeType,
            candidateContext.identity,
            new Map(candidateContext.captures),
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