import type { ExpressionNode } from "../ast/expression/ExpressionNode.js";
import type { SelectItem } from "../ast/query/SelectItem.js";
import type { ColumnValue } from "./ColumnValue.js";

export type SelectInput = ExpressionNode | ColumnValue | SelectItem;