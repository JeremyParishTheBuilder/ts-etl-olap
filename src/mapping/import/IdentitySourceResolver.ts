import { type JsonValue } from "../value/JsonValue.js";
import { type ImportSourceResolver } from "./ImportSourceResolver.js";

export class IdentitySourceResolver implements ImportSourceResolver {
  resolveMany(source: JsonValue): JsonValue[] {
    return [source];
  }

  resolveFirst(source: JsonValue): JsonValue {
    return source;
  }

  consumedKeys(): string[] {
    return [];
  }

  identityParts(): readonly string[] {
    return [];
  }
}