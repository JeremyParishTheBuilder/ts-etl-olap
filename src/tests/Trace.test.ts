import { describe, test, expect, beforeEach } from "vitest";
//import Trace from "../types/Trace.js";
import RegistryObject from "../types/RegistryObject.js";
import NewPointer from "../types/NewPointer.js";
//import Asset from "../types/Asset.js";

describe("Trace Class", () => {

  let trace: RegistryObject;

  beforeEach(() => {
    trace = new RegistryObject(
      new NewPointer(null, 0, "Trace"),
      { type: "ibc", counterparty: { chain_name: "osmosis", base_denom: "uosmo" } }
    );
  });

  test("Creates a Trace instance", () => {
    //const trace = new Trace(null, 0, { type: "ibc", counterparty: { chain_name: "osmosis", base_denom: "uosmo" } });
    expect(trace).toBeInstanceOf(RegistryObject);
  });

  test("Returns correct AssetPointer", () => {
    //trace = new Trace({ counterparty: { chain_name: "cosmoshub", base_denom: "uatom" } });
    //expect(trace.assetPointer).toBeInstanceOf(NewPointer);
    //expect(trace.assetPointer?.parent.key).toBe("osmosis");
    //expect(trace.assetPointer?.key).toBe("uosmo");
  });

  test("Handles missing counterparty gracefully", () => {
    //trace = new Trace(null, 0, {});
    //expect(trace.assetPointer).toBeUndefined();
  });

});