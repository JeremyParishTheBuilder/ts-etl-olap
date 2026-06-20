import { type Action } from "./Action.js";
import { type Databases } from "../schema/Databases.js";
import { type ColumnId } from "../schema/Column.js";
import { type Expression } from "../evaluation/expression/Expression.js";

// export class UpdateRowAction implements Action {
//   constructor(
//     private dbName: string,
//     private tableName: string,
//     private rowNum: number,
//     private inputs: Map<ColumnId, Expression>,//no long ExplicitInput, but now Expression
//   ) {}

//   apply(databases: Databases) {
//     const db = databases.requireByName(this.dbName);

//     const resolvedRow = db
//       .tables.requireByName(this.tableName)
//       .resolveUpdateInputs(this.inputs, this.rowNum); // TODO, need to evaluate expressions instead of resolve explicitInputs

//     const updatedDatabase = db
//       .updateRow(this.tableName, this.rowNum, resolvedRow);

//     return databases.update(updatedDatabase);
//   }
// }