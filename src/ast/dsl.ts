import type { ColumnValue } from "../types/ColumnValue.js";
import { CaseBuilder } from "./expression/CaseBuilder.js";
import { CastBuilder } from "./expression/CastBuilder.js";
import { ColumnExpressionNode } from "./expression/ColumnExpressionNode.js";
import { ConcatExpressionNode } from "./expression/ConcatExpressionNode.js";
import type { ExpressionNode } from "./expression/ExpressionNode.js";
import { LiteralExpressionNode } from "./expression/LiteralExpressionNode.js";
import { AndPredicateNode } from "./predicate/AndPredicateNode.js";
import { NotPredicateNode } from "./predicate/NotPredicateNode.js";
import { OrPredicateNode } from "./predicate/OrPredicateNode.js";
import type { PredicateNode } from "./predicate/PredicateNode.js";
import { XorPredicateNode } from "./predicate/XorPredicateNode.js";

// Expressions

export function col(name: string) {
  return new ColumnExpressionNode(name);
}

export function case_() {
  return new CaseBuilder();
}

export function concat(expressions: (ExpressionNode | ColumnValue)[]) {
  return new ConcatExpressionNode(expressions);
}

export function val(value: ColumnValue) {
  return new LiteralExpressionNode(value);
}

export function cast(expression: ExpressionNode | ColumnValue) {
  return new CastBuilder(expression);
}

// Predicates

export function and(left: PredicateNode, right: PredicateNode) {
  return new AndPredicateNode([left, right]);
}

export function or(left: PredicateNode, right: PredicateNode) {
  return new OrPredicateNode([left, right]);
}

export function xor(left: PredicateNode, right: PredicateNode) {
  return new XorPredicateNode(left, right);
}

export function not(inner: PredicateNode) {
  return new NotPredicateNode(inner);
}
