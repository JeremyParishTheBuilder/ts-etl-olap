import type { DiscoveryNavigator } from "./DiscoveryNavigator.js";
import { File } from "../File.js";
import { Directory } from "../Directory.js";
import type { DiscoveryValue } from "../../value/DiscoveryValue.js";
import type { ColumnValue } from "../../../types/ColumnValue.js";

export class FileNavigator implements DiscoveryNavigator<Directory, File>
{
  constructor() {}

  accepts(value: DiscoveryValue): value is Directory {
    return value instanceof Directory;
  }

  next(directory: Directory): readonly File[] {
    return directory.contents?.filter(obj => obj instanceof File) ?? [];
  }

  identityParts(
    current: Directory,
    next: File
  ): readonly ColumnValue[] {
    return [next.basename];
  }
}