import type { CaptureValue } from "../value/CaptureValue.js";
import type { DiscoveryValue } from "../value/DiscoveryValue.js";
import type { DiscoveryIdentity } from "./DiscoveryIdentity.js";

export class DiscoveryResult {
  constructor(
    readonly resultType: string,
    readonly identity: DiscoveryIdentity,
    readonly value: DiscoveryValue,
    readonly captures: Map<string, CaptureValue>,
    readonly children: DiscoveryResult[] = [],
  ) {}
}