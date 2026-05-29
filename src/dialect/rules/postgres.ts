import { ReferentialAction } from "../../schema/ReferentialAction.js";
import { DialectRules } from "../DialectRules.js";
import { CURRENT_DATE, CURRENT_TIME, CURRENT_TIMESTAMP, DEFAULT, NOW, type Keyword } from "../keywords.js";

//export const DEFAULT = Symbol("DEFAULT");
// TODO, implement keyword detection\
// alternatives: (sql.default(), sql.keyword("default"))

export const POSTGRES_FRAGMENTS: Record<string, string> = {
  createTable: "createTable",


  insertInto: "insertInto",
  values: "values",
  returning: "returning",

  ///...
};

export const POSTGRES_RULES: DialectRules = {
  fragments: POSTGRES_FRAGMENTS,
  
  identifiers: {
    quote: `"`,
    caseSensitive: true,
    maxLength: 63, // PostgreSQL identifier limit
  },

  ddl: {
    supportsIfExists: true,
    supportsDeferrableConstraints: true,
    supportsInlineForeignKeys: true,
  },

  constraints: {
    allowsMultipleAutoIncrement: false, // SERIAL / IDENTITY only once per table
    supportsNotValidatedConstraints: true,
    nullsDistinct: true,
    allowNullableForeignKeys: true,
    foreignKeyDefaultOnDelete: ReferentialAction.restrict,
    foreignKeyDefaultOnUpdate: ReferentialAction.restrict,
  },

  insert: {
    supportsDefaultKeyword: true,
    supportsReturning: true,
    supportsOnConflict: true,
    supportsOnDuplicateKey: false,
    supportsIgnore: false,
  },

  update: {
    supportsFrom: true,
    supportsLimit: false, // requires subquery
    supportsReturning: true,
  },

  delete: {
    supportsUsing: true,
    supportsLimit: false, // requires subquery
    supportsReturning: true,
  },

  input: {
    // keywords: new Set([
    //   "DEFAULT",
    //   "CURRENT_TIMESTAMP",
    //   "CURRENT_DATE",
    //   "CURRENT_TIME",
    //   "NOW",
    // ]),
    keywords: new Set<Keyword>([
      DEFAULT,
      CURRENT_TIMESTAMP,
      CURRENT_DATE,
      CURRENT_TIME,
      NOW,
    ])
  },

  transaction: {
    autoCommit: true,
    isolationLevel: "READ COMMITTED",
  },
};