import { describe, test, expect, beforeEach, vi } from "vitest";
import ChainRegistry from "../types/ChainRegistry.js";
import IbcConnection from "../types/IbcConnection.js";
import IbcConnectionParty from "../types/IbcConnectionParty.js";
import IbcChannel from "../types/IbcChannel.js";

describe("Ibc Connection Class", () => {

  let chain_reg = ChainRegistry.getInstance();

  let ibcConnection: IbcConnection | undefined;

  beforeEach(() => {
    ibcConnection = chain_reg.ibcConnection("osmosis", "cosmoshub") ?? undefined;
  });

  test("should initialize an Ibc Connection", () => {
    expect(ibcConnection).not.toBeUndefined();
  });

  test("key() is public, returns a string, and has correct order", () => {
    expect(ibcConnection?.key === "cosmoshub-osmosis");
  });

  test("properties should be retrievable", () => {
    expect(ibcConnection?.property(IbcConnection.PropertyName.CHAIN_1)?.[IbcConnectionParty.PropertyName.CHAIN_NAME] === "cosmoshub");
    expect(ibcConnection?.property(IbcConnection.CHANNELS)).not.toBeUndefined();
  });

  test("should be able to retreive an array of IBC Connections", () => {
    expect(chain_reg.ibcConnections([])?.length).toBeGreaterThan(600);
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
  });

  test("should be able to get channels", () => {
    //const channels = ibcConnection?.property(IbcConnection.PropertyName.CHANNELS);
    const channels = ibcConnection?.channels();
    expect(channels).not.toBeUndefined();
    const channel: IbcChannel | undefined = ibcConnection?.channel();
    expect(channel).not.toBeUndefined();
    expect(channel?.property(IbcChannel.CHAIN_1)[IbcChannel.PORT_ID]).toBe("transfer");
    expect(channel?.property(IbcChannel.CHAIN_2)[IbcChannel.PORT_ID]).toBe("transfer");
  });

});