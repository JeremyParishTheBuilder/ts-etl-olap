import { type ReferentialAction } from "../relational/ReferentialAction.js";
import {
  type Keyword,
  type SqlFunctionKeyword,
  type TemporalExpressionKeyword,
} from "./keywords.js";

export interface DialectRules {
  fragments: Record<string, string>;

  identifiers: {
    quote: string;
    caseSensitive: boolean;
    maxLength: number;
  };

  ddl: {
    supportsIfExists: boolean;
    supportsDeferrableConstraints: boolean;
    supportsInlineForeignKeys: boolean;
  };

  constraints: {
    allowsMultipleAutoIncrement: boolean;
    supportsNotValidatedConstraints: boolean;
    requireExplicitNames?: boolean;
    nullsDistinct: boolean;
    allowNullableForeignKeys: boolean;
    foreignKeyDefaultOnDelete: ReferentialAction;
    foreignKeyDefaultOnUpdate: ReferentialAction;
  };

  insert: {
    supportsDefaultKeyword: boolean;
    supportsReturning: boolean;
    supportsOnConflict: boolean;
    supportsOnDuplicateKey: boolean;
    supportsIgnore: boolean;
  };

  update: {
    supportsFrom: boolean;
    supportsLimit: boolean;
    supportsReturning: boolean;
  };

  delete: {
    supportsUsing: boolean;
    supportsLimit: boolean;
    supportsReturning: boolean;
  };

  input: {
    keywords?: ReadonlySet<Keyword>;
    temporalExpressions?: ReadonlySet<TemporalExpressionKeyword>;
    sqlFunctions?: ReadonlySet<SqlFunctionKeyword>;
  };

  transaction: {
    autoCommit?: boolean;
    isolationLevel?: "READ COMMITTED" | "REPEATABLE READ" | "SERIALIZABLE";
  };
}
