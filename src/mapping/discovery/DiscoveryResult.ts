import { type ColumnValue } from "../../types/ColumnValue.js";
import { type ImportRowIdentity } from "../import/ImportRowIdentity.js";
import { type FsObject } from "./FsObject.js";

export class DiscoveryResult {
  constructor(
    readonly resultType: string,
    readonly identity: ImportRowIdentity,
    readonly captures: Map<string, ColumnValue>,
    readonly objects: Map<string, FsObject>
  ) {}
}