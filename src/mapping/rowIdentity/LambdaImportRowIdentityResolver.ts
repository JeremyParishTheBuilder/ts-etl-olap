// import { type ColumnValue } from "../../types/ColumnValue.js";
// import { type ImportResult } from "../import/ImportResult.js";
// import { type RowIdentityPartResolver } from "./RowIdentityPartResolver.js";

// export class LambdaRowIdentityResolver implements RowIdentityPartResolver {
//   constructor(
//     private readonly fn: (result: ImportResult) => ColumnValue,
//   ) {}

//   resolve(result: ImportResult): ColumnValue {
//     return this.fn(result);
//   }
// }