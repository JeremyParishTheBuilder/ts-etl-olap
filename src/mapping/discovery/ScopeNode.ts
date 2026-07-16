// import { type ExpressionBuilder } from "../../dsl/expression/ExpressionBuilder.js";
// import { PredicateBuilder } from "../../dsl/predicate/PredicateBuilder.js";
// import { type CaptureContext } from "../value/CaptureContext.js";
// import { Directory } from "./Directory.js";
// import { type DiscoveryContext } from "./DiscoveryContext.js";
// import type { DiscoveryNavigator } from "./navigation/DiscoveryNavigator.js";
// import { type DiscoveryNode } from "./DiscoveryNode.js";
// import { DiscoveryResult } from "./DiscoveryResult.js";
// import type { DiscoveryValue } from "./navigation/DiscoveryValue.js";
// import { type FsObject } from "./FsObject.js";
// import { TraversalMode } from "./TraversalMode.js";

// export interface ScopeNodeSpec {
//   readonly matcher: PredicateBuilder<FsObject>,
//   readonly traversalMode: TraversalMode,
//   readonly children: readonly DiscoveryNode[],
//   readonly nodeType: string,
//   readonly captures?: Record<string, ExpressionBuilder<CaptureContext>>,
//   readonly objectName?: string,
// }

// export class ScopeNode implements DiscoveryNode {
//   constructor(readonly spec: ScopeNodeSpec) {}

//   discover(
//     context: DiscoveryContext
//   ): DiscoveryResult[] {

//     const current = context.current;

//     if (!(current instanceof Directory)) {
//       return [];
//     }

//     const objectName = this.spec.objectName ?? this.spec.nodeType;

//     const results: DiscoveryResult[] = [];

//     let candidates: FsObject[];

//     switch (this.spec.traversalMode) {

//       case TraversalMode.Self:
//         candidates = [current];
//         break;

//       case TraversalMode.Children:
//         //candiates = navigator.children(current) // here? where is it getting navigator?
//         candidates = current.contents ?? [];
//         break;

//       default: candidates = [];
//     }

//     for (const candidate of candidates) {

//       if (!(candidate instanceof Directory)) {
//         continue;
//       }

//       if (!this.spec.matcher.evaluate(candidate)) {
//         continue;
//       }

//       let candidateContext = context.withCurrent(candidate);

//       if (this.spec.traversalMode === TraversalMode.Children) {
//         candidateContext = candidateContext.withIdentityParts(
//           [candidate.basename]
//         );
//       }

//       for (const [name, builder] of Object.entries(this.spec.captures?? {})) {
//         candidateContext =
//           candidateContext.withCapture(
//             name,
//             builder.evaluate(candidateContext)
//           );
//       }

//       if (
//         this.spec.nodeType// &&
//         //this.spec.captureName
//       ) {
//         results.push(
//           new DiscoveryResult(
//             this.spec.nodeType,
//             candidateContext.identity,
//             new Map(candidateContext.captures),
//             //this.spec.objectName // here
//               //?
//               new Map([
//                   [
//                     objectName,
//                     candidate
//                   ]
//                 ])
//               //: new Map()
//           )
//         );
//       }

//       for (const childNode of this.spec.children) {
//         results.push(
//           ...childNode.discover(
//             candidateContext
//           )
//         );
//       }
//     }

//     return results;
//   }
// }

// export interface ScopeNodeSpec2<
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

// export class ScopeNode2<
//   TCurrent extends DiscoveryValue,
//   TChild extends DiscoveryValue
// > implements DiscoveryNode {
//   constructor(readonly spec: ScopeNodeSpec2<
//     TCurrent,
//     TChild
//     >) {}

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

//       // if (
//       //   this.spec.nodeType
//       // ) {
//         results.push(
//           new DiscoveryResult(
//             this.spec.nodeType,
//             candidateContext.identity,
//             new Map(candidateContext.captures),
//             new Map([
//               [
//                 objectName,
//                 candidate
//               ]
//             ])
//           )
//         );
//       //}

//       for (const childNode of this.spec.children) {
//         results.push(
//           ...childNode.discover(
//             candidateContext
//           )
//         );
//       }
//     }

//     return results;
//   }
// }