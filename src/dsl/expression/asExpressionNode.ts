// import {
//   ExpressionNodeBase,
//   isExpressionNode,
//   type ExpressionNode,
// } from "../../evaluation/expression/Expression.js";
// import { LiteralExpressionNode } from "../../semantic/ast/expression/LiteralExpressionNode.js";
// import { type ColumnValue } from "../../types/ColumnValue.js";
// import { type ExplicitInput } from "../../types/ExplicitInput.js";

// export function asExpressionNode(
//   value: ExpressionNode | ExplicitInput,
// ): ExpressionNode {
//   if (isExpressionNode(value)) {
//     return value;
//   }

//   return new LiteralExpressionNode(value as ColumnValue);
// }
