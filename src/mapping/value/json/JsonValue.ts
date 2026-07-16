export type JsonPrimitive =
  | null
  | string
  | number
  | boolean;

export interface JsonObject {
  [key: string]: JsonValue;
}

export type JsonArray = JsonValue[];

export type JsonValue =
  | JsonPrimitive
  | JsonObject
  | JsonArray;