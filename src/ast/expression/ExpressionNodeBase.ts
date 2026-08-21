import type { ColumnValue } from "../../types/ColumnValue.js";
import { ComparisonPredicateNode } from "../predicate/ComparisonPredicateNode.js";
import { asExpressionNode } from "./asExpressionNode.js";
import type { ExpressionNode } from "./ExpressionNode.js";

export abstract class ExpressionNodeBase {
  abstract readonly kind: string;

  // eq(this: ExpressionNode, expr: ExpressionNode | ColumnValue) {
  //   return new ComparisonPredicateNode(this, "eq", asExpressionNode(expr));
  // }

}
