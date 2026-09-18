import type { SelectStatement } from "./SelectStatement.js";
import { type UnionAllStatement } from "./UnionAllStatement.js";

export type QueryStatement = SelectStatement | UnionAllStatement;
