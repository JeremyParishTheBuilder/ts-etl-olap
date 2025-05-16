import { describe, test, expect, beforeEach } from "vitest";
import Trace from "../types/Trace.js";
import NewPointer from "../types/NewPointer.js";
import Asset from "../types/Asset.js";

describe("Trace Class", () => {

  let trace: Trace;

  beforeEach(() => {
    trace = new Trace(null, 0, { type: "ibc", counterparty: { chain_name: "osmosis", base_denom: "uosmo" } });
  });

  test("Creates a Trace instance", () => {
    //const trace = new Trace(null, 0, { type: "ibc", counterparty: { chain_name: "osmosis", base_denom: "uosmo" } });
    expect(trace).toBeInstanceOf(Trace);
  });

  test("Returns correct AssetPointer", () => {
    //trace = new Trace({ counterparty: { chain_name: "cosmoshub", base_denom: "uatom" } });
    expect(trace.assetPointer).toBeInstanceOf(NewPointer<Asset>);
    expect(trace.assetPointer?.parent.key).toBe("osmosis");
    expect(trace.assetPointer?.key).toBe("uosmo");
  });

  test("Handles missing counterparty gracefully", () => {
    trace = new Trace(null, 0, {});
    expect(trace.assetPointer).toBeUndefined();
  });

});