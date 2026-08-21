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
import {
  ConcatExpressionNode,
  type ResolvedConcatExpressionNode,
} from "./ConcatExpressionNode.js";
import type { TemporalExpressionNode } from "./TemporalExpressionNode.js";
import type { SqlFunctionExpressionNode } from "./SqlFunctionExpressionNode.js";
import type { CastExpressionNode, ResolvedCastExpressionNode } from "./CastExpressionNode.js";

export type ResolvedExpressionNode =
  | ResolvedColumnExpressionNode
  | LiteralExpressionNode
  | ResolvedCaseExpressionNode
  | ResolvedCastExpressionNode
  | ResolvedBinaryExpressionNode
  | ResolvedConcatExpressionNode
  | TemporalExpressionNode
  | SqlFunctionExpressionNode;

export type ExpressionNode =
  | ColumnExpressionNode
  | LiteralExpressionNode
  | CaseExpressionNode
  | CastExpressionNode
  | BinaryExpressionNode
  | ConcatExpressionNode
  | TemporalExpressionNode
  | SqlFunctionExpressionNode;
