// import { type ColumnValue } from "../../types/ColumnValue.js";
// import { type ValueResolverContext } from "../value/ValueResolverContext.js";
// import { type RowIdentityPartResolver } from "./RowIdentityPartResolver.js";

// export class CaptureIdentityPartResolver implements RowIdentityPartResolver {
//   constructor(
//     readonly captureName: string
//   ) {}

//   appendTo(
//     parts: ColumnValue[],
//     context: ValueResolverContext
//   ): void {
//     parts.push(context.capture(this.captureName));
//   }
// }