import type { DefaultValueNode } from "../ast/DefaultValueNode.js";
import type { ExpressionNode } from "../ast/expression/ExpressionNode.js";
import type { InputKeyword } from "../dialect/keywords.js";
import type { QueryStatement } from "../statements/dql/QueryStatement.js";
import type { ExpressionInput } from "./ExpressionInput.js";

export type InsertValuesInput = ExpressionInput | InputKeyword;

export type NormalizedInsertValues = (ExpressionNode | DefaultValueNode)[][];

export interface InsertValues {
  kind: "values";
  rows: NormalizedInsertValues;
}

export interface DefaultValues {
  kind: "defaultValues";
}

export interface InsertQuery {
  kind: "query";
  query: QueryStatement;
}

export type InsertSource = InsertValues | DefaultValues | InsertQuery;
