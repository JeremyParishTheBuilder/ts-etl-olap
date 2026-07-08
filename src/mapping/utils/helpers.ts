import { type ColumnValue } from "../../types/ColumnValue.js";
import { DerivedField } from "../import/DerivedField.js";
import { LambdaValueResolver } from "../value/LambdaValueResolver.js";
import { type ValueResolver } from "../value/ValueResolver.js";

export function fromCapture(
  name: string
): ValueResolver<ColumnValue> {
  return new LambdaValueResolver(
    ctx => ctx.capture(name)
  );
}

export function CaptureField(
  capture: string,
  column: string = capture
): DerivedField {
  return new DerivedField(
    column,
    fromCapture(capture)
  );
}