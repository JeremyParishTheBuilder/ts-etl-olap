import { Database } from "../schema/Database.js";
import { type ImportResult } from "./ImportResult.js";
import { type DatabaseSchema } from "./schema/DatabaseSchema.js";

// export class DatabaseBuilder {
//   build(
//     schema: DatabaseSchema,
//     imports: ImportResult[]
//   ): Database {
//     const database = new Database(schema);

//     for (const importResult of imports) {
//       const table =
//         database.table(importResult.tableName);

//       table.insert(importResult);
//     }

//     return database;
//   }
// }