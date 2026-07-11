// import { Directory } from "../../mapping/discovery/Directory.js";
// import { type FsObject } from "../../mapping/discovery/FsObject.js";
// import { type Predicate } from "./Predicate.js";

// export class ContainsPredicate
//   implements Predicate<FsObject> {

//   constructor(
//     private predicates: Predicate[]
//   ) {}

//   evaluate(
//     obj: FsObject
//   ): boolean {
//     if (!(obj instanceof Directory)) {
//       throw new Error(`Expected Directory`);
//     }

//     return obj.contents?.includes(content => this.predicates[0].evaluate(content));
//   }
// }