import { type PredicateBuilder } from "../../dsl/predicate/PredicateBuilder.js";
import { type Directory } from "./Directory.js";
import { type FileReader } from "./FileReader.js";
import { type FsObject } from "./FsObject.js";
import { File } from "./File.js";

export class FileLoader<T> {
  constructor(
    readonly matcher: PredicateBuilder<FsObject>,
    readonly reader: FileReader<T>
  ) {}

  load(
    directory: Directory
  ): T | null {   
    const file = directory
      .find(File)
      .find(f => this.matcher.evaluate(f));

    if (!file) {
      return null;
    }

    return this.reader.read(file);
  }
}