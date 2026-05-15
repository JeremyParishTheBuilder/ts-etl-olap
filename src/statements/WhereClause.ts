import { type ColumnValue } from "../schema/Column.js";

export type ComparisonOperator = "eq" | "ne" | "gt" | "lt" | "gte" | "lte";

export type WhereClause =
  | {
      type: "comparison";
      column: string;
      operator: ComparisonOperator;
      value: ColumnValue;
    }
  | {
      type: "null_check";
      column: string;
      operator: "is_null" | "is_not_null";
    }
  | {
      type: "between";
      column: string;
      lower: ColumnValue;
      upper: ColumnValue;
    }
  | {
      type: "in";
      column: string;
      values: ColumnValue[];
    }
  | {
      type: "logical";
      operator: "and" | "or";
      left: WhereClause;
      right: WhereClause;
    }
  | {
      type: "not";
      inner: WhereClause;
    };