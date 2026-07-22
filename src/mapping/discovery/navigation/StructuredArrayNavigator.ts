import type { ColumnValue } from "../../../types/ColumnValue.js";
import type { DiscoveryValue } from "../../value/DiscoveryValue.js";
import type { DiscoveryNavigator } from "./DiscoveryNavigator.js";
import type { StructuredArray, StructuredElement } from "../../value/StructuredValue.js";

export class StructuredArrayNavigator
  implements DiscoveryNavigator<StructuredArray, StructuredElement> {

  accepts(current: DiscoveryValue): current is StructuredArray {
    return Array.isArray(current);
  }

  next(array: StructuredArray): readonly StructuredElement[] {
    return array.map(
      (value, index) => ({
        index,
        value
      })
    );
  }

  identityParts(
    current: StructuredArray,
    next: StructuredElement
  ): readonly ColumnValue[] {
    return [next.index];
  }
}