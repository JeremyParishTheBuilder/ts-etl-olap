import { File } from "../../mapping/discovery/File.js";
import { type FsObject } from "../../mapping/discovery/FsObject.js";
import { type Predicate } from "./Predicate.js";

export class IsFilePredicate implements Predicate<FsObject> {
  evaluate(obj: FsObject): boolean {
    return obj instanceof File;
  }
}
