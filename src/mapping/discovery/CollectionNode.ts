// import { type ExpressionBuilder } from "../../dsl/expression/ExpressionBuilder.js";
// import { PredicateBuilder } from "../../dsl/predicate/PredicateBuilder.js";
// import { type CaptureContext } from "../value/CaptureContext.js";
// import { Directory } from "./Directory.js";
// import { type DiscoveryContext } from "./DiscoveryContext.js";
// import { type DiscoveryNode } from "./DiscoveryNode.js";
// import { DiscoveryResult } from "./DiscoveryResult.js";
// import { type FsObject } from "./FsObject.js";
// import type { DiscoveryNavigator } from "./navigation/DiscoveryNavigator.js";
// import type { DiscoveryValue } from "./navigation/DiscoveryValue.js";

// export interface CollectionNodeSepc {
//   readonly matcher: PredicateBuilder<FsObject>,
//   readonly children: readonly DiscoveryNode[],
//   readonly nodeType: string,
//   readonly captures?: Record<string, ExpressionBuilder<CaptureContext>>,
//   readonly objectName?: string,
// }

// export class CollectionNode implements DiscoveryNode {
//   constructor(readonly spec: CollectionNodeSepc) {}

//   discover(
//     context: DiscoveryContext
//   ): DiscoveryResult[] {
//     const current =
//       context.current;

//     if (!(current instanceof Directory)) {
//       return [];
//     }

//     const results: DiscoveryResult[] = [];

//     const contents = current.contents ?? [];

//     const objectName = this.spec.objectName ?? this.spec.nodeType;

//     for (const child of contents) {
//       if (!(child instanceof Directory)) {
//         continue;
//       }

//       if (
//         !this.spec.matcher.evaluate(child)
//       ) {
//         continue;
//       }

//       let childContext = context
//         .withCurrent(child)
//         .withIdentityParts([child.basename]);

//       for (const [name, builder] of Object.entries(this.spec.captures?? {})) {
//         childContext =
//           childContext.withCapture(
//             name,
//             builder.evaluate(childContext)
//           );
//       }

//       results.push(
//         new DiscoveryResult(
//           this.spec.nodeType,
//           childContext.identity,
//           new Map(childContext.captures),
//           new Map([
//             [
//               objectName,
//               child
//             ]
//           ])
//         )
//       );

//       for (const node of this.spec.children) {
//         results.push(
//           ...node.discover(
//             childContext
//           )
//         );
//       }
//     }

//     return results;
//   }
// }

// export interface CollectionNodeSpec2<
//   TCurrent extends DiscoveryValue,
//   TChild extends DiscoveryValue
// > {
//   readonly nodeType: string,
//   readonly navigator: DiscoveryNavigator<TCurrent, TChild>;
//   readonly matcher: PredicateBuilder<TChild>,
//   readonly children: readonly DiscoveryNode[],
//   readonly captures?: Record<string, ExpressionBuilder<CaptureContext>>,
//   readonly objectName?: string,
// }

// export class CollectionNode2<
//   TCurrent extends DiscoveryValue,
//   TChild extends DiscoveryValue
// > implements DiscoveryNode {

//   constructor(readonly spec: CollectionNodeSpec2<
//     TCurrent,
//     TChild
//   >) {}

//   discover(
//     context: DiscoveryContext
//   ): DiscoveryResult[] {
//     const results: DiscoveryResult[] = [];

//     const objectName = this.spec.objectName ?? this.spec.nodeType;

//     const navigator = this.spec.navigator;

//     if (!navigator.accepts(context.current)) {
//       return [];
//     }

//     const candidates = navigator.next(context.current);

//     for (const candidate of candidates) {
//       if (!this.spec.matcher.evaluate(candidate)) {
//         continue;
//       }

//       let candidateContext = context.withCurrent(candidate);

//       candidateContext = candidateContext.withIdentityParts(
//         navigator.identityParts(context.current, candidate)
//       )

//       for (const [name, builder] of Object.entries(this.spec.captures?? {})) {
//         candidateContext = candidateContext.withCapture(
//           name,
//           builder.evaluate(candidateContext)
//         );
//       }

//       results.push(
//         new DiscoveryResult(
//           this.spec.nodeType,
//           candidateContext.identity,
//           new Map(candidateContext.captures),
//           new Map([
//             [
//               objectName,
//               candidate
//             ]
//           ])
//         )
//       );

//       for (const node of this.spec.children) {
//         results.push(
//           ...node.discover(
//             candidateContext
//           )
//         );
//       }
//     }

//     return results;
//   }
// }