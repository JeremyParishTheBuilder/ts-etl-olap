import { type ColumnType, columnTypeFromValue } from "../../types/ColumnType.js";
import { isColumnValue } from "../../types/ColumnValue.js";

export class ColumnSchema {
  constructor(
    readonly name: string,
    public type: ColumnType = "unknown",
  ) {}

  observe(value: unknown): void {
     if (!isColumnValue(value)) {
      return;
    }

    const observed = columnTypeFromValue(value);

    if (this.type === "unknown") {
      this.type = observed;
      return;
    }

    if (this.type !== observed) {
      throw new Error(
        `Column '${this.name}' has inconsistent observed types.`
      );
    }
  }
}