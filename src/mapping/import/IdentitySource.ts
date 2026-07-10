import { type JsonValue } from "../value/JsonValue.js";
import { type ImportSource } from "./ImportSource.js";

export class IdentitySource implements ImportSource {
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