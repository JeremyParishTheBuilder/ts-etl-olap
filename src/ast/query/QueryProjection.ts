import type { ColumnValue } from "../../types/ColumnValue.js";
import type {
  ExpressionNode,
  ExpressionProjection,
} from "../expression/ExpressionNode.js";

export type QueryProjection =
  "*" | (ExpressionNode | ExpressionProjection | ColumnValue)[];
