import type { SelectStatement } from "./SelectStatement.js";
import { type UnionAllStatement } from "./setOperations/UnionAllStatement.js";

export type QueryStatement = SelectStatement | UnionAllStatement;
