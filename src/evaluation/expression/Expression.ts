import { type ColumnValue } from "../../types/ColumnValue.js";
import { type RowView } from "../../schema/RowView.js";
import {
  type ResolvedCaseExpressionNode,
  type CaseExpressionNode
} from "../../semantic/ast/expression/CaseExpressionNode.js";
import { 
  type ResolvedColumnExpressionNode,
  type ColumnExpressionNode
} from "../../semantic/ast/expression/ColumnExpressionNode.js";
import { type LiteralExpressionNode } from "../../semantic/ast/expression/LiteralExpressionNode.js";
import { type ConcatExpressionNode } from "../../semantic/ast/expression/ConcatExpressionNode.js";
import {
  type BinaryExpressionNode,
  type ResolvedBinaryExpressionNode
} from "../../semantic/ast/expression/BinaryExpressionNode.js";

export interface Expression<
  TContext = RowView,
  TValue = ColumnValue
> {
  evaluate(context: TContext): TValue;
  consumedKeys?(): readonly string[];
}

export type ResolvedExpressionNode =
  | ResolvedColumnExpressionNode
  | LiteralExpressionNode
  | ResolvedCaseExpressionNode
  | ResolvedBinaryExpressionNode
  | ConcatExpressionNode;

export type ExpressionNode =
  | ColumnExpressionNode
  | LiteralExpressionNode
  | CaseExpressionNode
  | BinaryExpressionNode
  | ConcatExpressionNode;

export abstract class ExpressionNodeBase {
  abstract readonly kind: string;
}

export function isExpressionNode(
  value: unknown,
): value is ExpressionNode {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value
  );
}