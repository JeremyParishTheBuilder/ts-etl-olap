import { type JsonValue } from "../value/JsonValue.js";

export interface ArrayLocation {
  readonly path: readonly string[];
  readonly values: readonly JsonValue[];
}