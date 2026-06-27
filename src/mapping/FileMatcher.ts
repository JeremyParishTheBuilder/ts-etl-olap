import { File } from "./File.js";
import { type FsObject } from "./FsObject.js";
import { FsObjectMatcher } from "./FsObjectMatcher.js";

export class AnyFileMatcher implements FsObjectMatcher {

  matches(
    object: FsObject
  ): boolean {
    return (
      object instanceof File
    );
  }
}

export class FileNameMatcher implements FsObjectMatcher {

  constructor(
    readonly name: string
  ) {}

  matches(
    object: FsObject
  ): boolean {
    return (
      object instanceof File &&
      object.basename === this.name
    );
  }
}

export class FileNameSetMatcher implements FsObjectMatcher {

  constructor(
    readonly names: ReadonlySet<string>
  ) {}

  matches(
    object: FsObject
  ): boolean {
    return (
      object instanceof File &&
      this.names.has(object.basename)
    );
  }
}