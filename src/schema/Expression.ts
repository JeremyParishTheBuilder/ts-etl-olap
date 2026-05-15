import type { ColumnValue } from './Column.js';
 
export type Expression =
  | { readonly kind: "const"; readonly value: ColumnValue }
  | { readonly kind: "identity" }
  | { readonly kind: "map"; readonly cases: Record<string, string>; readonly default?: string; };

// export function cloneExpression(expr: Expression): Expression {
//   switch (expr.kind) {
//     case "const":
//       return {
//         kind: "const",
//         value:
//           typeof expr.value === "object" &&
//           expr.value !== null &&
//           "kind" in expr.value
//             ? cloneExpression(expr.value as Expression)
//             : expr.value
//       };

//     case "identity":
//       return { kind: "identity" };

//     case "map":
//       return {
//         kind: "map",
//         cases: { ...expr.cases },
//         default: expr.default
//       };
//   }
// }