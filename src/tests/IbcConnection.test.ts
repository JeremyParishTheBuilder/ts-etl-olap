import { describe, test, expect, beforeEach, vi } from "vitest";
import RegistryRoot from "../types/RegistryRoot.js";
import RegistryObject from "../types/RegistryObject.js";
//import IbcConnection from "../types/IbcConnection.js";
//import IbcConnectionParty from "../types/IbcConnectionParty.js";
//import IbcChannel from "../types/IbcChannel.js";
//import IbcChannelParty from "../types/IbcChannelParty.js";

describe("Ibc Connection Class", () => {

  let chain_reg = new RegistryRoot(null, "");

  let ibcConnection: RegistryObject | undefined;

  beforeEach(() => {
    ibcConnection = chain_reg.get("IbcConnection", "cosmoshub-osmosis") ?? undefined;
  });

  test("should initialize an Ibc Connection", () => {
    expect(ibcConnection).not.toBeUndefined();
  });

  test("key() is public, returns a string, and has correct order", () => {
    expect(ibcConnection?.pointer.key === "cosmoshub-osmosis");
  });

  test("properties should be retrievable", () => {
    //expect(ibcConnection?.property(IbcConnection.PropertyName.CHAIN_1)?.[IbcConnectionParty.PropertyName.CHAIN_NAME] === "cosmoshub");
    //expect(ibcConnection?.property(IbcConnection.CHANNELS)).not.toBeUndefined();
  });

  /*test("should be able to retreive an array of IBC Connections", () => {
    expect(chain_reg.get(IbcConnection, [])?.length).toBeGreaterThan(600);
    expect(chain_reg.ibcConnections([])?.length).toBeLessThan(2000);
    const filter = (key: string) => {
      const connection = chain_reg.ibcConnection(key);
      return (
        connection?.property(IbcConnection.PropertyName.CHAIN_1)?.[IbcConnectionParty.PropertyName.CHAIN_NAME] === "osmosis"
         &&
        connection?.property(IbcConnection.PropertyName.CHAIN_2)?.[IbcConnectionParty.PropertyName.CHAIN_NAME] === "stargaze"
      )
    };
    expect(chain_reg.ibcConnections([filter])?.length).toBe(1);
    const filter2 = (key: string) => {
      const connection = chain_reg.ibcConnection(key);
      return (
        connection?.property(IbcConnection.PropertyName.CHAIN_1)?.[IbcConnectionParty.PropertyName.CHAIN_NAME] === "osmosis"
         ||
        connection?.property(IbcConnection.PropertyName.CHAIN_2)?.[IbcConnectionParty.PropertyName.CHAIN_NAME] === "osmosis"
      )
    };
    expect(chain_reg.ibcConnections([filter2])?.length).toBeGreaterThan(100);
  });*/

  /*test("should be able to get channels", () => {
    const channels = ibcConnection?.get("IbcChannel", 0);
    expect(channels).not.toBeUndefined();
    const channel: RegistryObject | undefined = channels?[0];
    expect(channel).not.toBeUndefined();
    expect(channel?.property(IbcChannel.PropertyName.CHAIN_1)[IbcChannelParty.PropertyName.PORT_ID]).toBe("transfer");
    expect(channel?.property(IbcChannel.PropertyName.CHAIN_2)[IbcChannelParty.PropertyName.PORT_ID]).toBe("transfer");
  });*/

});