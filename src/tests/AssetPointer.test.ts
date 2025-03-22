import { describe, test, expect, beforeEach } from "vitest";
import AssetPointer from "../types/AssetPointer.js";
import ChainPointer from "../types/ChainPointer.js";

describe("AssetPointer Class", () => {
  let assetPointer: AssetPointer;

  beforeEach(() => {
    assetPointer = new AssetPointer(new ChainPointer(undefined, "osmosis"), "uosmo");
  });

  test("Creates a AssetPointer instance", () => {
    expect(assetPointer).toBeInstanceOf(AssetPointer);
  });

  test("Returns Parent Pointer of ChainPointer Type", () => {
    expect(assetPointer.parent instanceof ChainPointer).toBeTruthy();
  });

  test("Returns correct Chain Name", () => {
    expect(assetPointer.parent.key).toBe("osmosis");
  });

  test("Returns correct Base Denom", () => {
    expect(assetPointer.key).toBe("uosmo");
  });

});