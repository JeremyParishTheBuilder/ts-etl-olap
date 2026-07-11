import { Directory } from "../../mapping/discovery/Directory.js";
import { type DiscoveryContext } from "../../mapping/discovery/DiscoveryContext.js";
import { FsObject } from "../../mapping/discovery/FsObject.js";
import { type Expression } from "./Expression.js";

export class DirectoryNameExpression
  implements Expression<DiscoveryContext, string> {

  evaluate(
    context: DiscoveryContext
  ): string {
    const current = context.current;

    if (!(current instanceof Directory)) {
      throw new Error("Expected Directory.");
    }

    return current.basename;
  }
}

export class DirectoryNameFsExpression
  implements Expression<FsObject, string> {

  evaluate(
    obj: FsObject
  ): string {
    if (!(obj instanceof Directory)) {
      throw new Error("Expected Directory.");
    }

    return obj.basename;
  }
}