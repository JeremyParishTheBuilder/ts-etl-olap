// import { type ColumnValue } from "../../types/ColumnValue.js";
// import { type ValueResolverContext } from "../value/ValueResolverContext.js";
// import { type RowIdentityPartResolver } from "./RowIdentityPartResolver.js";

// export class ParentRowIdentityPartResolver implements RowIdentityPartResolver {
//   appendTo(
//     parts: ColumnValue[],
//     context: ValueResolverContext
//   ): void {
//     if (!context.rowIdentity) {
//       throw new Error("No parent row identity.");
//     }

//     parts.push(...context.rowIdentity.parts);
//   }
// }