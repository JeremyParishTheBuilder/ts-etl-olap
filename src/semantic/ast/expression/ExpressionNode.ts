import {
  BinaryExpressionNode,
  type ResolvedBinaryExpressionNode,
} from "./BinaryExpressionNode.js";
import {
  type ResolvedCaseExpressionNode,
  type CaseExpressionNode,
} from "./CaseExpressionNode.js";
import {
  type ResolvedColumnExpressionNode,
  type ColumnExpressionNode,
} from "./ColumnExpressionNode.js";
import { type LiteralExpressionNode } from "./LiteralExpressionNode.js";
import { ConcatExpressionNode } from "./ConcatExpressionNode.js";

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

export function isExpressionNode(value: unknown): value is ExpressionNode {
  return typeof value === "object" && value !== null && "kind" in value;
}
