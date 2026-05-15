// import { type Action } from "./Action.js";
// import { createQueryResult } from "../engine/QueryResult.js";

// export class SelectAction implements Action {
//   constructor(
//     private table: string,
//     private columns: string[]
//   ) {}

//   public apply(ctx: ExecutionContext) {
//     const table = ctx.table(this.table);
//     const columns = table.requireColumns(this.columns);
//     const data = table.requireColumnDatas(this.columns);
//     return createQueryResult(columns, data);
//   }
// }