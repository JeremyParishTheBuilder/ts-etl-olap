import { DialectRules } from "../DialectRules.js";

export const SQLSERVER_RULES: DialectRules = {
  identifiers: {
    quote: `"`,             // SQL Server allows double quotes if QUOTED_IDENTIFIER ON
    caseSensitive: false,   // Default collation is case-insensitive
    maxLength: 128,         // SQL Server max identifier length
  },

  ddl: {
    supportsIfExists: true,           // DROP TABLE / DROP COLUMN ... IF EXISTS is supported in recent versions
    supportsDeferrableConstraints: false, // SQL Server does not support DEFERRABLE
    supportsInlineForeignKeys: true,
  },

  constraints: {
    allowsMultipleAutoIncrement: false, // Only one IDENTITY column per table
    allowNullableForeignKeys: true,
    supportsNotValidatedConstraints: true,
  },

  insert: {
    supportsDefaultKeyword: true,
    supportsReturning: false,           // INSERT ... OUTPUT is supported
    supportsOnConflict: false,         // Postgres-only
    supportsOnDuplicateKey: false,     // MySQL-only
    supportsIgnore: false,             // INSERT IGNORE not supported
  },

  update: {
    supportsFrom: true,                // UPDATE ... FROM is supported
    supportsLimit: false,              // Must use TOP or OFFSET/FETCH
    supportsReturning: true,           // Can use OUTPUT clause
  },

  delete: {
    supportsUsing: false,              // DELETE ... USING not supported
    supportsLimit: false,              // Use TOP or OFFSET/FETCH
    supportsReturning: true,           // Can use OUTPUT clause
  },

  values: {
    keywords: new Set([
      "DEFAULT",
      "NULL",
      "CURRENT_TIMESTAMP",
      "GETDATE()",
      "TRUE",
      "FALSE",
    ]),
  },

  transaction: {
    autoCommit: true,
    isolationLevel: "READ COMMITTED",
  },
};
