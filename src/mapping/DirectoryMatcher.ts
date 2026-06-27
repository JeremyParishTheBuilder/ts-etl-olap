import { Directory } from "./Directory.js";
import { FsObject } from "./FsObject.js";
import { FsObjectMatcher } from "./FsObjectMatcher.js";

export class AnyDirectoryMatcher implements FsObjectMatcher {

  matches(
    object: FsObject
  ): boolean {
    return (
      object instanceof Directory
    );
  }
}

export class DirectoryNameMatcher implements FsObjectMatcher {

  constructor(
    readonly name: string
  ) {}

  matches(
    object: FsObject
  ): boolean {
    return (
      object instanceof Directory &&
      object.basename === this.name
    );

  }
}

export class NotDirectoryNameMatcher implements FsObjectMatcher {

  constructor(
    readonly name: string
  ) {}

  matches(
    object: FsObject
  ): boolean {
    return (
      object instanceof Directory &&
      object.basename !== this.name
    );
  }
}

export class DirectoryNameSetMatcher implements FsObjectMatcher {

  constructor(
    readonly names: ReadonlySet<string>
  ) {}

  matches(
    object: FsObject
  ): boolean {
    return (
      object instanceof Directory &&
      this.names.has(object.basename)
    );
  }
}

export class DirectoryContentIncludesMatcher implements FsObjectMatcher {

  constructor(
    readonly name: string
  ) {}

  matches(
    object: FsObject
  ): boolean {
    if (!(object instanceof Directory)) {
      return false;
    }
    return object.contents?.some(obj => obj.basename === this.name) ?? false;
  }
}