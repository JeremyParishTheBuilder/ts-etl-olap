import { type FsObject } from "./FsObject.js";

export interface FsObjectMatcher {

  matches(
    object: FsObject
  ): boolean;

}