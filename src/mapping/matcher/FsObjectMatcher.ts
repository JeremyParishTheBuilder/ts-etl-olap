import { type FsObject } from "../discovery/FsObject.js";

export interface FsObjectMatcher {
  matches(
    object: FsObject
  ): boolean;
}