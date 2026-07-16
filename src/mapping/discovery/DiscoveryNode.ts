import type { ExpressionBuilder } from "../../dsl/expression/ExpressionBuilder.js";
import type { PredicateBuilder } from "../../dsl/predicate/PredicateBuilder.js";
import type { CaptureContext } from "./CaptureContext.js";
import type { CaptureValue } from "../value/CaptureValue.js";
import type { DiscoveryDecoder } from "./decoding/DiscoveryDecoder.js";
import { type DiscoveryContext } from "./DiscoveryContext.js";
import { DiscoveryResult } from "./DiscoveryResult.js";
import type { DiscoveryNavigator } from "./navigation/DiscoveryNavigator.js";
import type { DiscoveryValue } from "../value/DiscoveryValue.js";

export interface DiscoveryNodeSpec<
  TCurrent extends DiscoveryValue,
  TNavigation extends DiscoveryValue,
  TDecoded extends DiscoveryValue,
> {
  readonly nodeType: string,
  readonly navigator: DiscoveryNavigator<TCurrent, TNavigation>;
  readonly matcher: PredicateBuilder<TNavigation>,
  readonly children: readonly DiscoveryNode[],
  readonly captures?: Record<string, ExpressionBuilder<DiscoveryContext, CaptureValue>>,
  readonly objectName?: string,
  readonly decoder?: DiscoveryDecoder<TNavigation, TDecoded>,
}

export class DiscoveryNode {
  constructor(readonly spec: DiscoveryNodeSpec<
    DiscoveryValue,
    DiscoveryValue,
    DiscoveryValue
    >) {}

  discover(
    context: DiscoveryContext
  ): DiscoveryResult[] {
    const results: DiscoveryResult[] = [];

    const objectName = this.spec.objectName ?? this.spec.nodeType;

    const decoder = this.spec.decoder;

    const navigator = this.spec.navigator;

    if (!navigator.accepts(context.current)) {
      return [];
    }

    const candidates = navigator.next(context.current);

    for (const candidate of candidates) {
      if (!this.spec.matcher.evaluate(candidate)) {
        continue;
      }

      let current: DiscoveryValue = candidate;

      if (decoder) {
        if (!decoder.accepts(current)) {
          continue;
        }

        const decoded = this.spec.decoder.decode(current);

        if (decoded == null) {
          continue;
        }

        current = decoded;
      }

      let candidateContext = context.withCurrent(current);

      candidateContext = candidateContext.withIdentityParts(
        navigator.identityParts(context.current, candidate)
      )

      for (const [name, builder] of Object.entries(this.spec.captures?? {})) {
        candidateContext = candidateContext.withCapture(
          name,
          builder.evaluate(candidateContext)
        );
      }

      results.push(
        new DiscoveryResult(
          this.spec.nodeType,
          candidateContext.identity,
          new Map(candidateContext.captures),
          new Map([
            [
              objectName,
              current
            ]
          ])
        )
      );

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