import { type JsonValue } from "../value/JsonValue.js";

export interface ImportSource {
  resolveMany(source: JsonValue): readonly JsonValue[];
  resolveFirst(source: JsonValue): JsonValue;
  consumedKeys(): string[];
  identityParts(): readonly string[];
}