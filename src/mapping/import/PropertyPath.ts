import type { CaptureValue } from "../value/CaptureValue.js";

export class PropertyPath {
  constructor(
    readonly parts: readonly string[],
  ) {}

  resolve(
    value: CaptureValue,
  ): CaptureValue {
    let current = value;

    for (const part of this.parts) {
      if (
        current == null ||
        typeof current !== "object"
      ) {
        return null;
      }

      current = (current as any)[part];
    }

    return current;
  }

  static parse(
    path: string,
  ): PropertyPath {
    return new PropertyPath(
        path.split(".")
    );
  }
}