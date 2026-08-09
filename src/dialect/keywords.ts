import type { SqlFunctionKind } from "../evaluation/expression/SqlFunctionExpression.js";
import type { TemporalExpressionKind } from "../evaluation/expression/TemporalExpression.js";

export const DEFAULT = Symbol("DEFAULT");

export const CURRENT_TIMESTAMP = Symbol("CURRENT_TIMESTAMP");
export const CURRENT_DATE = Symbol("CURRENT_DATE");
export const CURRENT_TIME = Symbol("CURRENT_TIME");

export const NOW = Symbol("NOW");
export const GETDATE = Symbol("GETDATE");

export type Keyword = typeof DEFAULT;

export type TemporalExpressionKeyword =
  typeof CURRENT_TIMESTAMP | typeof CURRENT_DATE | typeof CURRENT_TIME;

export const TEMPORAL_EXPRESSION_KINDS = new Map<
  TemporalExpressionKeyword,
  TemporalExpressionKind
>([
  [CURRENT_TIMESTAMP, "current_timestamp"],
  [CURRENT_DATE, "current_date"],
  [CURRENT_TIME, "current_time"],
]);

export const TEMPORAL_EXPRESSION_KEYWORDS = new Map<
  TemporalExpressionKind,
  TemporalExpressionKeyword
>([
  ["current_timestamp", CURRENT_TIMESTAMP],
  ["current_date", CURRENT_DATE],
  ["current_time", CURRENT_TIME],
]);

export type SqlFunctionKeyword = typeof NOW | typeof GETDATE;

export const SQL_FUNCTION_KINDS = new Map<SqlFunctionKeyword, SqlFunctionKind>([
  [NOW, "now"],
  [GETDATE, "getdate"],
]);

export const SQL_FUNCTION_KEYWORDS = new Map<
  SqlFunctionKind,
  SqlFunctionKeyword
>([
  ["now", NOW],
  ["getdate", GETDATE],
]);

export type InputKeyword =
  Keyword | TemporalExpressionKeyword | SqlFunctionKeyword;
