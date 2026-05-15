import { Expression } from "../schema/Expression.js";

export function evalExpression(
  expr: Expression,
  input?: any
): any {
  switch (expr.kind) {
    case "const":
      return expr.value;

    case "identity":
      if (input === undefined) {
        throw new Error("identity expression requires input");
      }
      return input;

    case "map":
      if (input === undefined) {
        throw new Error("map expression requires input");
      }
      return expr.cases[input] ?? expr.default ?? "";
  }
}