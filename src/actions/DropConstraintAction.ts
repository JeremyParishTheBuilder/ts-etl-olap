import { type Action } from "./Action.js";
import { type Databases } from "../relational/Databases.js";

// export class DropConstraintAction implements Action {
//   constructor(
//     private dbName: string,
//     private tableName: string,
//     private constraintName: string,
//   ) {}

//   apply(databases: Databases): Databases {
//     const updatedDb = databases.require(this.dbName)
//       .dropConstraint(
//         this.tableName,
//         this.constraintName
//       );

//     return databases.update(updatedDb);
//   }
// }