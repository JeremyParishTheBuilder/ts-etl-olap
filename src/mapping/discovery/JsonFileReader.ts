import fs from "fs";
import { type FileReader } from "./FileReader.js";
import { type File } from "./File.js";
import type { StructuredValue } from "../value/StructuredValue.js";

// TODO - delete
export class JsonFileReader implements FileReader<StructuredValue> {
  read(file: File): StructuredValue {
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