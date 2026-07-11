import { NotPredicateNode } from "./NotPredicateNode.js";
import { type PredicateNode } from "./PredicateNode.js";

// Note: the functions are currently called via inputBatch, so sql. signified AST rather than runtime
// and these are unused 

// export function and(left: PredicateNode, right: PredicateNode) {
//   return new BinaryLogicalPredicateNode(
//     left,
//     right,
//     "and",
//   );
// }

// export function or(left: PredicateNode, right: PredicateNode) {   
//   return new BinaryLogicalPredicateNode(
//     left,
//     right,
//     "or",
//   );
// }

// export function xor(left: PredicateNode, right: PredicateNode) {   
//   return new BinaryLogicalPredicateNode(
//     left,
//     right,
//     "xor",
//   );
// }

// export function not(inner: PredicateNode) {   
//   return new NotPredicateNode(
//     inner,
//   );
// }