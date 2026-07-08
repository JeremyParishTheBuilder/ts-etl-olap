import { type File } from "./File.js"

export interface FileReader<T> {
  read(
    file: File
  ): T | null;
}