import { describe, test, expect, beforeEach, vi } from "vitest";
import Chain from "../types/Chain.js";
import NewPointer from "../types/NewPointer.js";
//import ChainRegistry from "../types/ChainRegistry.js";
import RegistryObject from "../types/RegistryObject.js"
import RegistryRoot from "../types/RegistryRoot.js"
import MultiRegistryRoot from "../types/MultiRegistryRoot.js"
import { CosmosChainRegistry, CosmosChainRegistryTypes } from '../registries/CosmosChainRegistry.js';

vi.mock("../types/ChainRegistry", () => ({
  default: {
    getInstance: vi.fn(() => ({
      chain: vi.fn(() => null),
      asset: vi.fn(() => null),
    })),
  },
}));

describe("Chain Class", () => {
  const reg = new RegistryRoot(CosmosChainRegistry, "Cosmos");
  let chain = new RegistryObject(new NewPointer(reg.pointer, "osmosis", "chain"), { "pretty_name": "Osmosis" });
  //const chain_reg_ptr = new NewPointer(root, null, null);

/*  beforeEach(() => {
    chain = new Chain(chain_reg_ptr, "osmosis", { "pretty_name": "Osmosis" });
  });*/

  test("should initialize with correct ChainPointer", () => {
    expect(chain.pointer.parent).toBeNull();
    //expect(chain.pointer instanceof ChainPointer).toBeTruthy();
    expect(chain.pointer.key).toBe("osmosis");
  });

  test("should return correct property values", () => {
    expect(chain.property("pretty_name")).toBe("Osmosis");
  });

  test("should derive decimals correctly", () => {
    //expect(asset.property(Asset.DerivedPropertyName.DECIMALS)).toBe(6);
  });

  test("should return undefined for missing properties", () => {
    //expect(asset.property("non_existent_property")).toBeUndefined();
  });

  test("should return lastTrace as undefined when no traces exist", () => {
    //expect(asset.lastTrace).toBeUndefined();
  });

});
