// import { type Action } from "./Action.js";
// import { type UniqueSpec } from "../types/constraints/Constraint.js";
// import { type Databases } from "../types/Databases.js";

// export class AddUniqueAction implements Action {
//   constructor(
//     private dbName: string,
//     private tableName: string,
//     private spec: UniqueSpec,
//   ) {}

//   apply(databases: Databases): Databases {
//     const index = Index.fromSpec(this.spec);

//     const db = databases.require(this.dbName);

//     const updatedTable = db.tables.require(this.tableName)
//       .addIndex(index);

//     return databases.update(
//       db.updateTable(updatedTable)
//     );
//   }
// }