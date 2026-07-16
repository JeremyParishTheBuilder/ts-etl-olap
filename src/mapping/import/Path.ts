import type { CaptureValue } from "../value/CaptureValue.js";
import { type JsonValue } from "../value/json/JsonValue.js";
import { type ImportSource } from "./ImportSource.js";

// export class JustAPath {
//   constructor(
//     public readonly parts: readonly string[]
//   ) {}

//   static parse(path: string): Path {
//     return new Path(path.split("."));
//   }
// }

// export class ObjectNavigator implements ImportSource {
//   // constructor(
//   //   public readonly path: readonly string[]
//   // ) {}

//   resolveMany(
//     source: JsonValue,
//     path: JustAPath,
//   ): JsonValue[] {
//     let current: any = source;

//     for (const part of path) {
//       if (current == null) {
//         return [];
//       }

//       current = current[part];
//     }

//     if (current == null) {
//       return [];
//     }

//     if (Array.isArray(current)) {
//       return current;
//     }

//     return [current];
//   }

//   resolveFirst(
//     source: JsonValue,
//     path: JustAPath,
//   ): JsonValue {
//     const values = this.resolveMany(source, path);

//     return values.length
//       ? values[0]
//       : null;
//   }

//   consumedKeys(): string[] {
//     return path.length > 0
//       ? [path[0]]
//       : [];
//   }

//   static parse(path: string): Path {
//     return new Path(
//       path.split(".")
//     );
//   }

//   identityParts(): readonly string[] {
//     return this.path;
//   }
// }

export class Path implements ImportSource {
  constructor(
    public readonly path: readonly string[]
  ) {}

  resolveMany = (source: CaptureValue): JsonValue[] => {
    let current: any = source;

    for (const part of this.path) {
      if (current == null) {
        return [];
      }

      current = current[part];
    }

    if (current == null) {
      return [];
    }

    if (Array.isArray(current)) {
      return current;
    }

    return [current];
  }

  resolveFirst = (source: CaptureValue): JsonValue => {
    const values = this.resolveMany(source);

    return values.length
      ? values[0]
      : null;
  }

  consumedKeys(): string[] {
    return this.path.length > 0
      ? [this.path[0]]
      : [];
  }

  static parse(path: string): Path {
    return new Path(
      path.split(".")
    );
  }

  identityParts(): readonly string[] {
    return this.path;
  }
}