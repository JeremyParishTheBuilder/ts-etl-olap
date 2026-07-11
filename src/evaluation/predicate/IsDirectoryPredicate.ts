import { Directory } from "../../mapping/discovery/Directory.js";
import { type FsObject } from "../../mapping/discovery/FsObject.js";
import { type Predicate } from "./Predicate.js";

export class IsDirectoryPredicate
  implements Predicate<FsObject> {

  evaluate(
    obj: FsObject
  ): boolean {
    return obj instanceof Directory;
  }
}