import { isColumnValue } from "../../types/ColumnValue.js";
import {
  isSameType,
  sqlTypeFromValue,
  type SqlType,
} from "../../types/SqlType.js";

export class ColumnSchema {
  constructor(
    readonly name: string,
    public type?: SqlType,
  ) {}

  observe(value: unknown): void {
    if (!isColumnValue(value)) {
      return;
    }

    if (value === null) {
      return;
    }

    const observed = sqlTypeFromValue(value);

    if (this.type === undefined) {
      this.type = observed;
      return;
    }

    if (!isSameType(this.type, observed)) {
      throw new Error(`Column '${this.name}' has inconsistent observed types.`);
    }
  }

  requireType(): SqlType {
    if (!this.type) {
      throw new Error(`Column '${this.name}' has no inferred type.`);
    }

    return this.type;
  }
}
