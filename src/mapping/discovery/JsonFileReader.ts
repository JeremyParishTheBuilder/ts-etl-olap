import fs from "fs";
import { type FileReader } from "./FileReader.js";
import { type File } from "./File.js";
import { type JsonValue } from "../value/json/JsonValue.js";

export class JsonFileReader implements FileReader<JsonValue> {
  read(file: File): JsonValue {
    if (!file.basename.endsWith(".json")) {
      return null;
    }

    try {
      return JSON.parse(
        fs.readFileSync(
          file.fullPath,
          "utf8"
        )
      );
    } catch {
      return null;
    }
  }
}