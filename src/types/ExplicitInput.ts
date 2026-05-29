import { type Keyword } from "../dialect/keywords.js";
import { type ColumnValue } from "../schema/Column.js";

export type ExplicitInput =
  | ColumnValue
  | Keyword;