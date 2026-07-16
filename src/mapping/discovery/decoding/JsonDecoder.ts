import type { JsonObject } from "../../value/json/JsonValue.js";
import { File } from "../File.js";
import type { DiscoveryValue } from "../../value/DiscoveryValue.js"
import type { DiscoveryDecoder } from "./DiscoveryDecoder.js";
import fs from "fs";

export class JsonDecoder implements DiscoveryDecoder<
  File,
  JsonObject
> {
  accepts(value: DiscoveryValue): value is File {
    return value instanceof File;
  }

  decode(value: File): JsonObject | null {
    if (!value.basename.endsWith(".json")) {
      return null;
    }

    try {
      return JSON.parse(
        fs.readFileSync(
          value.fullPath,
          "utf8"
        )
      );
    } catch {
      return null;
    }
  }
}