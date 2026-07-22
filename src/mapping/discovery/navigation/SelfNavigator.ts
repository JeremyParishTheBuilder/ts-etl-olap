import type { ColumnValue } from "../../../types/ColumnValue.js";
import type { DiscoveryNavigator } from "./DiscoveryNavigator.js";
import type { DiscoveryValue } from "../../value/DiscoveryValue.js";

export class SelfNavigator<T extends DiscoveryValue>
  implements DiscoveryNavigator<T, T> {

  constructor(
    private readonly ctor: new (...args: never[]) => T
  ) {}

  accepts(current: DiscoveryValue): current is T {
    //return this.acceptsFn(current);
    return current instanceof this.ctor;
  }

  next(current: T): readonly T[] {
    return [current];
  }

  identityParts(current: T, next: T): readonly ColumnValue[] {
    return [];
  }
}