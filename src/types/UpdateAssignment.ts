import type { DEFAULT } from "../dialect/keywords.js";
import type { Expression } from "../evaluation/expression/Expression.js";

export type UpdateAssignment = Expression | typeof DEFAULT;
