import { describe, test, expect, beforeEach, vi } from "vitest";
import Asset from "../types/Asset.js";
import Trace from "../types/Trace.js";
import { AssetPropertyName, AssetDerivedPropertyName } from "../constants/AssetConstants.js";
import { TraceType } from "../constants/TraceConstants.js";

vi.mock("../types/ChainRegistry", () => ({
  default: {
    getInstance: vi.fn(() => ({
      chain: vi.fn(() => null),
      asset: vi.fn(() => null),
    })),
  },
}));

describe("Asset Class", () => {
  let asset: Asset;

  beforeEach(() => {
    asset = new Asset("osmosis", "uosmo", {
      display: "OSMO",
      denom_units: [
        { denom: "uosmo", exponent: 0 },
        { denom: "OSMO", exponent: 6 },
      ],
    });
  });

  test("should initialize with correct AssetPointer", () => {
    expect(asset.assetPointer.chainName).toBe("osmosis");
    expect(asset.assetPointer.baseDenom).toBe("uosmo");
  });

  test("should return correct property values", () => {
    expect(asset.property("display")).toBe("OSMO");
    expect(asset.property("denom_units")).toEqual([
      { denom: "uosmo", exponent: 0 },
      { denom: "OSMO", exponent: 6 },
    ]);
  });

  test("should derive decimals correctly", () => {
    expect(asset.property(AssetDerivedPropertyName.DECIMALS)).toBe(6);
  });

  test("should return undefined for missing properties", () => {
    expect(asset.property("non_existent_property")).toBeUndefined();
  });

  test("should return lastTrace as undefined when no traces exist", () => {
    expect(asset.lastTrace).toBeUndefined();
  });

  test("should return lastTrace when traces exists", () => {
    const newAsset = new Asset("osmosis", "ibc/...", {
      traces: [
        {
          type: "bridged",
          counterparty: {
            chain_name: "cosmoshub",
            base_denom: "uatom"
          }
        }
      ],
    })
    expect(newAsset.lastTrace?.assetPointer?.chainName).toBe("cosmoshub");
    expect(newAsset.lastTrace?.assetPointer?.baseDenom).toBe("uatom");
  });

  test("should return traces correctly", () => {
    const trace = new Trace({ type: TraceType.IBC });
    vi.spyOn(asset, "lastTrace", "get").mockReturnValue(trace);
    expect(asset.lastTrace).toBe(trace);
  });

});
