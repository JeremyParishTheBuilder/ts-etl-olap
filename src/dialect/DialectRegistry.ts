import { Dialect } from "./Dialect.js";
import { type DialectRules } from "./DialectRules.js";

import { POSTGRES_RULES } from "./rules/postgres.js";
import { MYSQL_RULES } from "./rules/mysql.js";
import { SQLSERVER_RULES } from "./rules/sqlserver.js";

export const DIALECT_RULES: Record<Dialect, DialectRules> = {
  [Dialect.Postgres]: POSTGRES_RULES,
  [Dialect.MySQL]: MYSQL_RULES,
  [Dialect.SQLServer]: SQLSERVER_RULES,
};
