import { BinaryExpressionNode } from "../../evaluation/expression/BinaryExpressionNode.js";
import { ColumnExpressionNode } from "../../evaluation/expression/ColumnExpression.js";
import { type ExpressionNode } from "../../evaluation/expression/Expression.js";
import { ComparisonPredicateNode } from "../../evaluation/predicate/ComparisonPredicate.js";
import { type ColumnValue } from "../../schema/Column.js";
import { asExpressionNode } from "../expression/asExpressionNode.js";

// export class ColumnBuilder {
//   constructor(
//     private readonly columnName: string,
//   ) {}

//   private get columnNode() {
//     return new ColumnExpressionNode(
//       this.columnName,
//     );
//   }

// // -- Predicates --

//   eq(expr: ExpressionNode | ColumnValue) {
//     return new ComparisonPredicateNode(
//       this.columnNode,
//       "eq",
//       asExpressionNode(expr),
//     );
//   }

//   ne(expr: ExpressionNode | ColumnValue) {
//     return new ComparisonPredicateNode(
//       this.columnNode,
//       "ne",
//       asExpressionNode(expr),
//     );
//   }

//   gt(expr: ExpressionNode | ColumnValue) {
//     return new ComparisonPredicateNode(
//       this.columnNode,
//       "gt",
//       asExpressionNode(expr),
//     );
//   }

//   gte(expr: ExpressionNode | ColumnValue) {
//     return new ComparisonPredicateNode(
//       this.columnNode,
//       "gte",
//       asExpressionNode(expr),
//     );
//   }

//   lt(expr: ExpressionNode | ColumnValue) {
//     return new ComparisonPredicateNode(
//       this.columnNode,
//       "lt",
//       asExpressionNode(expr),
//     );
//   }

//   lte(expr: ExpressionNode | ColumnValue) {
//     return new ComparisonPredicateNode(
//       this.columnNode,
//       "lte",
//       asExpressionNode(expr),
//     );
//   }

//   // isNull() {
//   //   return new UnaryLogicalPredicateNode(
//   //     this.columnNode,
//   //     "is_null",
//   //     asExpressionNode(null),
//   //   );
//   // }

//   // isNotNull() {
//   //   this.parent.addWhereClause({
//   //     type: "null_check",
//   //     column: this.column,
//   //     operator: "is_not_null",
//   //   }, this.logicalOp);

//   //   return this.parent;
//   // }

//   // between(lower: ColumnValue, upper: ColumnValue) {
//   //   this.parent.addWhereClause({
//   //     type: "between",
//   //     column: this.column,
//   //     lower: lower,
//   //     upper: upper,
//   //   }, this.logicalOp);

//   //   return this.parent;
//   // }

//   // in(values: ColumnValue[]) {
//   //   this.parent.addWhereClause({
//   //     type: "in",
//   //     column: this.column,
//   //     values: values,
//   //   }, this.logicalOp);

//   //   return this.parent;
//   // }

// // -- Expressions --

//   add(expr: ExpressionNode) {
//     return new BinaryExpressionNode(
//       this.columnNode,
//       "add",
//       asExpressionNode(expr),
//     );
//   }

//   subtract(expr: ExpressionNode) {
//     return new BinaryExpressionNode(
//       this.columnNode,
//       "subtract",
//       asExpressionNode(expr),
//     );
//   }

//   multiply(expr: ExpressionNode) {
//     return new BinaryExpressionNode(
//       this.columnNode,
//       "multiply",
//       asExpressionNode(expr),
//     );
//   }

//   divide(expr: ExpressionNode) {
//     return new BinaryExpressionNode(
//       this.columnNode,
//       "divide",
//       asExpressionNode(expr),
//     );
//   }

//   mod(expr: ExpressionNode) {
//     return new BinaryExpressionNode(
//       this.columnNode,
//       "mod",
//       asExpressionNode(expr),
//     );
//   }
// }