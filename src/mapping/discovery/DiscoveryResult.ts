import { type ImportRowIdentity } from "../import/ImportRowIdentity.js";
import type { CaptureValue } from "../value/CaptureValue.js";
import type { DiscoveryValue } from "../value/DiscoveryValue.js";
import type { DiscoveryIdentity } from "./DiscoveryIdentity.js";

export class DiscoveryResult {
  constructor(
    readonly resultType: string,
    //readonly identity: ImportRowIdentity,
    readonly identity: DiscoveryIdentity,
    readonly captures: Map<string, CaptureValue>,
    readonly objects: Map<string, DiscoveryValue>
  ) {}
}