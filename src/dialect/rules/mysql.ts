import { type DialectRules } from "../DialectRules.js";
import { CURRENT_TIMESTAMP, DEFAULT, type Keyword } from "../keywords.js";

const MYSQL_FRAGMENTS: Record<string, string> = {
  createTable: "createTable",

  insertInto: "insertInto",
  values: "values",
  returning: "returning",

  ///...
};

export const MYSQL_RULES: DialectRules = {
  fragments: MYSQL_FRAGMENTS,

  identifiers: {
    quote: "`",
    caseSensitive: false, // MySQL identifiers are case-insensitive by default
    maxLength: 64, // MySQL max identifier length
  },

  ddl: {
    supportsIfExists: true,
    supportsDeferrableConstraints: false, // MySQL does not support deferrable constraints
    supportsInlineForeignKeys: false,
  },

  constraints: {
    allowsMultipleAutoIncrement: false, // only one AUTO_INCREMENT column per table
    supportsNotValidatedConstraints: true,
    nullsDistinct: true,
    allowNullableForeignKeys: true,
    foreignKeyDefaultOnDelete: "restrict",
    foreignKeyDefaultOnUpdate: "restrict",
  },

  insert: {
    supportsDefaultKeyword: true,
    supportsReturning: false, // MySQL does not support RETURNING
    supportsOnConflict: false, // Postgres-specific
    supportsOnDuplicateKey: true, // MySQL specific: ON DUPLICATE KEY UPDATE
    supportsIgnore: true, // INSERT IGNORE is supported
  },

  update: {
    supportsFrom: false, // UPDATE ... FROM is Postgres/SQL Server syntax, not MySQL
    supportsLimit: true, // MySQL supports UPDATE ... LIMIT
    supportsReturning: false, // Not supported
  },

  delete: {
    supportsUsing: false, // DELETE ... USING is not standard in MySQL
    supportsLimit: true, // DELETE ... LIMIT is supported
    supportsReturning: false, // Not supported
  },

  input: {
    keywords: new Set<Keyword>([DEFAULT, CURRENT_TIMESTAMP]),
  },

  transaction: {
    autoCommit: true,
    isolationLevel: "REPEATABLE READ",
  },
};
