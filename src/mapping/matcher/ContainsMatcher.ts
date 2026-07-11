import { type Predicate } from "../../evaluation/predicate/Predicate.js";
import { Directory } from "../discovery/Directory.js";
import { type FsObject } from "../discovery/FsObject.js";
import { type FsObjectMatcher } from "./FsObjectMatcher.js";

export class ContainsMatcher implements FsObjectMatcher {
  constructor(
    readonly predicate: Predicate<FsObject>
  ) {}

  matches(obj: FsObject): boolean {
    if (!(obj instanceof Directory)) {
      return false;
    }

    const contents = obj.contents ?? [];

    return contents.some(child =>
      this.predicate.evaluate(child)
    );
  }
}