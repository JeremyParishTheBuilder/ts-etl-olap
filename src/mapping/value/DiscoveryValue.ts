import type { JsonValue } from "./json/JsonValue.js";
import type { FsObject } from "../discovery/FsObject.js";
import type { JsonElement } from "./json/JsonElement.js";
import type { JsonProperty } from "./json/JsonProperty.js";

export type DiscoveryValue =
  | FsObject
  | JsonValue
  | JsonProperty
  | JsonElement;