import { Directory } from "../../mapping/discovery/Directory.js";
import { type FsObject } from "../../mapping/discovery/FsObject.js";
import { type Predicate } from "./Predicate.js";

export class ContainsPredicate implements Predicate<FsObject> {
  constructor(private predicate: Predicate<FsObject>) {}

  evaluate(obj: FsObject): boolean {
    if (!(obj instanceof Directory)) {
      return false;
    }

    return (obj.contents ?? []).some((child) => this.predicate.evaluate(child));
  }
}
