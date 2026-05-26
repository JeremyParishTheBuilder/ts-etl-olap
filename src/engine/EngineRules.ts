import { Dialect, DIALECT_RULES } from "../dialect/index.js";
import { ReferentialAction } from "../schema/ReferentialAction.js";

export interface EngineRuleSpec<T> {
  engineDefault: T; // fallback default
  dialectDefault?: (d: Dialect) => T | undefined; // returns undefined if dialect has no default
  dialectStrict?: (d: Dialect) => T | undefined; // returns undefined if dialect has no default
}

export const ENGINE_RULES: Record<
  string, // domain, e.g., "constraints", "transaction"
  Record<string, EngineRuleSpec<any>> // rules inside the domain
> = {
  ddl: {
    supportsInlineForeignKeys: {
      dialectStrict: (d: Dialect) =>
        DIALECT_RULES[d].ddl.supportsInlineForeignKeys,
      engineDefault: true,
    }
  },

  constraints: {
    validateExistingDataOnAdd: {
      engineDefault: true,
    },

    allowNullableForeignKeys: {
      dialectDefault: (d: Dialect) =>
        DIALECT_RULES[d].constraints.allowNullableForeignKeys,
      engineDefault: true,
    },

    foreignKeyDefaultOnDelete: {
      dialectDefault: (d: Dialect) =>
        DIALECT_RULES[d].constraints.foreignKeyDefaultOnDelete,
      engineDefault: ReferentialAction.restrict,
    },

    foreignKeyDefaultOnUpdate: {
      dialectDefault: (d: Dialect) =>
        DIALECT_RULES[d].constraints.foreignKeyDefaultOnUpdate,
      engineDefault: ReferentialAction.restrict,
    },

    requireExplicitNames: {
      dialectDefault: (d: Dialect) =>
        DIALECT_RULES[d].constraints?.requireExplicitNames,
      engineDefault: false,
    },

    nullsDistinct: {
      dialectDefault: (d: Dialect) =>
        DIALECT_RULES[d].constraints?.nullsDistinct,
      engineDefault: true,
    },
  },

  transaction: {
    isolationLevel: {
      dialectDefault: (d: Dialect) =>
        DIALECT_RULES[d].transaction?.isolationLevel,
      engineDefault: "READ COMMITTED",
    },

    autoCommit: {
      dialectDefault: (d: Dialect) =>
        DIALECT_RULES[d].transaction?.autoCommit,
      engineDefault: true,
    },

    trackStatementHistory: {
      engineDefault: true,
    },
  },

  values: {
    keywords: {
      dialectDefault: (d: Dialect) =>
        DIALECT_RULES[d].values?.keywords,
      engineDefault: new Set<string>("NULL")
    },
  },
};