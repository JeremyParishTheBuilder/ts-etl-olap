import { type ColumnValue } from "../../types/ColumnValue.js";
import { type FsObject } from "../discovery/FsObject.js";
import type { DiscoveryValue } from "./DiscoveryValue.js";
import { type JsonArray, type JsonObject } from "./json/JsonValue.js";

// export type CaptureValue =
//   | ColumnValue
//   | JsonObject
//   | JsonArray
//   | FsObject;

  export type CaptureValue = DiscoveryValue;