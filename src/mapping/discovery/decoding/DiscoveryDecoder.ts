import type { DiscoveryValue } from "../../value/DiscoveryValue.js";

export interface DiscoveryDecoder<
  TIn extends DiscoveryValue,
  TOut extends DiscoveryValue,
> {
  accepts(value: DiscoveryValue): value is TIn;
  decode(value: TIn): TOut | null;
}
