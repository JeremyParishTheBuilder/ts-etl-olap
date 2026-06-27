import { JsonPathResolver } from "./JsonPathResolver.js";

export class JsonPath {
  static parse(path: string): JsonPathResolver {
    return new JsonPathResolver(path.split("."));
  }
}