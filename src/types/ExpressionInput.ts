import type { ExpressionNode } from "../ast/expression/ExpressionNode.js";
import type { ColumnValue } from "./ColumnValue.js";

export type ExpressionInput = ExpressionNode | ColumnValue;
