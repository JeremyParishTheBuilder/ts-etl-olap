import { describe, test, expect, beforeEach } from "vitest";
import AssetPointer from "../types/AssetPointer.js";

describe("AssetPointer Class", () => {
  let assetPointer: AssetPointer;

  beforeEach(() => {
    assetPointer = new AssetPointer("osmosis", "uosmo");
  });

  test("Creates a AssetPointer instance", () => {
    //const assetPointer = new AssetPointer("osmosis", "uosmo");
    expect(assetPointer).toBeInstanceOf(AssetPointer);
  });

  test("Returns correct Chain Name", () => {
    //const assetPointer = new AssetPointer("osmosis", "uosmo");
    expect(assetPointer).toBeInstanceOf(AssetPointer);
    expect(assetPointer.chainName).toBe("osmosis");
  });

  test("Returns correct Base Denom", () => {
    //const assetPointer = new AssetPointer("osmosis", "uosmo");
    expect(assetPointer).toBeInstanceOf(AssetPointer);
    expect(assetPointer.baseDenom).toBe("uosmo");
  });

});