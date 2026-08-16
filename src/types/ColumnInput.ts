import { type DEFAULT } from "../dialect/keywords.js";
import { type ColumnValue } from "./ColumnValue.js";

export type ColumnInput = ColumnValue | typeof DEFAULT;
