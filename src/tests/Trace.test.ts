import { describe, test, expect } from "vitest";
import Trace from "../types/Trace.js";
import AssetPointer from "../types/AssetPointer.js";

describe("Trace Class", () => {

  test("Creates a Trace instance", () => {
    const trace = new Trace({ type: "ibc", counterparty: { chain_name: "osmosis", base_denom: "uosmo" } });
    expect(trace).toBeInstanceOf(Trace);
  });

  test("Returns correct AssetPointer", () => {
    const trace = new Trace({ counterparty: { chain_name: "cosmoshub", base_denom: "uatom" } });
    expect(trace.assetPointer).toBeInstanceOf(AssetPointer);
    expect(trace.assetPointer?.chainName).toBe("cosmoshub");
    expect(trace.assetPointer?.baseDenom).toBe("uatom");
  });

  test("Handles missing counterparty gracefully", () => {
    const trace = new Trace({});
    expect(trace.assetPointer).toBeUndefined();
  });

});