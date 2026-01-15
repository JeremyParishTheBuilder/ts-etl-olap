export interface DialectRules {
  identifiers: {
    quote: string;
    caseSensitive: boolean;
    maxLength: number;
  };

  ddl: {
    supportsIfExists: boolean;
    supportsDeferrableConstraints: boolean;
    supportsInlineForeignKeys: boolean,
  };

  constraints: {
    allowsMultipleAutoIncrement: boolean;
    supportsNotValidatedConstraints: boolean;
    allowNullableForeignKeys?: boolean;
    requireExplicitNames?: boolean;
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

  values: {
    keywords: ReadonlySet<string>;
  };

  transaction: {
    autoCommit?: boolean;
    isolationLevel?: "READ COMMITTED" | "REPEATABLE READ" | "SERIALIZABLE";
  };
}