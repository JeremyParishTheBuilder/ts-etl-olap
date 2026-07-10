import { capture } from "../../dsl/expression/functions.js";
import { type ColumnValue } from "../../types/ColumnValue.js";
//import { DerivedField } from "../value/DerivedField.js";
import { LambdaValueResolver } from "../value/LambdaValueResolver.js";
import { type ValueResolver } from "../value/ValueResolver.js";

// export function fromCapture(
//   name: string
// ): ValueResolver<ColumnValue> {
//   return new LambdaValueResolver(
//     ctx => ctx.capture(name)
//   );
// }

// export function CaptureField(
//   captureName: string,
//   columnName: string = captureName
// ): DerivedField {
//   return new DerivedField(
//     columnName,
//     capture(captureName)
//   );
// }