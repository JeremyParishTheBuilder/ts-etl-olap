//import ChainRegistry from '../types/ChainRegistry.js';
import RegistryObject from '../types/RegistryObject.js';
import RegistryRoot from '../types/RegistryRoot.js';
import Pointer from '../types/Pointer.js';
import { CosmosChainRegistry } from '../registries/CosmosChainRegistry.js';
import MultiRegistryRoot from '../types/MultiRegistryRoot.js';

export const getChainRegContents = () => {

  console.log("starting chain reg");
  const chain_reg = new RegistryRoot(CosmosChainRegistry, "Cosmos");
  console.log("started");
  //console.log(chain_reg);
  //console.log(chain_reg.pointer);
  console.log("here is the chain_reg");
  const obj = chain_reg.pointer?.parent?.object as MultiRegistryRoot;
  console.log("here's obj");
  //console.log(obj);
  console.log("and now");
  //console.log(obj?.get("RegistryRoot", "Cosmos"));
  //console.log(chain_reg);
  console.log("there was the chain_reg");
 

  const chain = chain_reg.get("Chain", "osmosis");
  console.log("chain");
  console.log(chain)
  if (chain) {
    console.log("Pretty Name");
    console.log(chain.property("pretty_name")); // Osmosis
    console.log("That was the pretty_name--should be Osmosis");


    console.log(chain.property("blah")); // undefined
    console.log("That was the blah--should be undefined");
    console.log("Assets:");
    const asset = chain.get("Asset", "uosmo");
    console.log(asset);
    console.log("That was the asset by looking from the chain level");
    const asset2 = chain_reg.get("Asset", "uosmo");
    console.log(asset2);
    console.log("That was the asset by looking from the chain_reg level--should be undefined");

    console.log(chain.get("Asset", "uosmo")?.property("name"));
    console.log("That was uosmo name, should be 'Osmosis'");

    console.log(chain_reg.get("Chain", "osmosis")?.get("Asset", "uosmo")?.property("name"));
    console.log("That was uosmo name, should be 'Osmosis'");

    console.log("Versions:");
    console.log(chain_reg.get("Chain", "osmosis")?.get("Version", "v28")?.property("recommended_version"));

    console.log(chain_reg.get("Chain", "cosmoshub")?.get("Asset", "uatom")?.property("description"));

    console.log("Last Trace:");
    console.log(chain_reg.get("Chain", "osmosis")?.
      get("Asset", "ibc/F6B691D5F7126579DDC87357B09D653B47FDCE0A3383FF33C8D8B544FE29A8A6")?.
      get("Trace", 0)
    );
    console.log("Traces:");
    const traces = chain_reg.get("Chain", "osmosis")?.
      get("Asset", "ibc/F6B691D5F7126579DDC87357B09D653B47FDCE0A3383FF33C8D8B544FE29A8A6")?.
      property("traces");
    console.log("Traces:");
    console.log(traces);
    console.log(traces[0].property("counterparty"));


    console.log("Decimals:");
    console.log(chain_reg.
      get("Chain", "cosmoshub")?.
      get("Asset", "uatom")?.
      property("decimals")
    );



    //console.log(chain_reg.chain("cosmoshub")?.asset("uatom")?.property("decimals"));
    console.log("Atom:");
    console.log(chain_reg.
      get("Chain", "osmosis")?.
      get("Asset", "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2")?.
      property("extended_description")
    );
    console.log("reference osmosis' ATOM, but inheriting the ext_desc");

    ///uncomment when ready

    console.log(chain_reg.
      get("Chain", "osmosis")?.
      get("Asset", "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2")?.
      property("extended_description", false)
    );
    console.log("reference osmosis' ATOM, without inheriting--should be undefined");

    /*console.log("Traces:");
    console.log(traces);*/
    /*console.log("USDC");
    console.log(arrayToJson(
      chain_reg.
      get("Chain", "osmosis")?.
      get("Asset", "ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858")?.
      property(Asset.PropertyName.TRACES)
    ));*/


    console.log(chain_reg.
      get("Chain", "osmosis")?.
      get("Asset", "ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858")?.
      toJSON()
    );
    console.log("That was the JSON");

    /*const multiTrace = chain_reg.
      get("Chain", "osmosis")?.
      get("Asset", "ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858")?.
      property("traces");
    console.log("multiTrace:");
    console.log(multiTrace);*/



    console.log(
      chain_reg.
        get("IbcConnection", "cosmoshub-osmosis")?.
        property("channels")
    );



    /*const filter2 = (chainPtr: Pointer) => chain_reg.get("Chain", chainPtr.key)
      ?.property(Chain.PropertyName.BECH32_PREFIX) === "osmo";
    chain_reg.find("Chain", [filter2])?.forEach((chainPtr) => {
      console.log(chainPtr);
    });*/

    const filter25 = (chainPointer: Pointer) => chainPointer.object
      ?.property("bech32_prefix") === "osmo";

    const results25: Pointer[] = chain_reg.find("Chain", [filter25]);
    results25.forEach((chainPointer: Pointer) => {
      console.log(chainPointer.key);
    });

    console.log("Done");

    /*const results26: Pointer[] = chain_reg.find("Chain");
    results26.forEach((chainPointer: Pointer) => {
      console.log(chainPointer.key);
    });

    console.log("Done2");*/




    //const filter3 = (asset: AssetPointer) => chain_reg.asset(asset)?.property("symbol") === "OSMO";
    const filter3 = (assetPointer: Pointer) =>
      assetPointer.object?.property("symbol") === "OSMO";
    //console.log(chain_reg.chain("kopi"));
    //console.log(chain_reg.chain("kopi")?.assets());
    //console.log(chain_reg.chain("kopi")?.assets([filter3]));

    //const filteredAssets: any[] = chain_reg.assets([filter3]);
    const filteredAssets: Pointer[] = chain_reg.find("Asset", [filter3]);
    //console.log(filteredAssets);

    filteredAssets?.forEach((assetPtr) => {
      //console.log(assetPtr.object?.property("base"));
      //console.log("any");
      console.log(assetPtr.key);
    });

    console.log("those were the assets");


    console.log("IBC Connections:");

    /*const filteredConnections45: any[] = chain_reg.find("IbcConnection", [()=>true]);
    filteredConnections45?.forEach((ptr) => {
      console.log(ptr.object?.property("chain_1"));
      console.log(ptr.object?.property("chain_2"));
    });*/


    const property = chain_reg.
      get("IbcConnection", "juno-osmosis")?.
      get("IbcChannel", 1)?.
      property("chain_1");
    console.log(property);



    console.log("IBC Channels:");
    const filter4 = (ptr: Pointer) => {
      const obj: RegistryObject | undefined = ptr.object;
      return (
        (
          obj?.get("IbcChannelParty", 0)?.property("channel_id") === "channel-0" ||
          obj?.get("IbcChannelParty", 1)?.property("channel_id") === "channel-0"
        ) &&
        (
          obj?.get("IbcChannelParty", 0)?.property("port_id") === "transfer" ||
          obj?.get("IbcChannelParty", 1)?.property("port_id") === "transfer"
        ) &&
        (obj?.property("tags")?.status === "live" || obj?.property("tags")?.status === undefined)
      );
    }
    const filteredChannels4: Pointer[] = chain_reg.find("IbcChannel", [filter4]);
    filteredChannels4?.forEach((ptr) => {
      //console.log(ptr.parent?.object?.property("chain_1"));
      //console.log(ptr.parent?.object?.property("chain_2"));
      console.log(ptr.object?.get("IbcChannelParty", 0)?.property("channel_id"));
      console.log(ptr.object?.get("IbcChannelParty", 1)?.property("channel_id"));
    });


    //Q: Which assets have a two denoms where they are are the same letters just with different letter casing?
    console.log("same denom unit:");
    const filter5 = (assetPointer: Pointer) => {
      const denom_units = assetPointer.object?.property("denom_units");
      for (let i = 0; i <= denom_units.length - 1; ++i) {
        for (let j = i; j <= denom_units.length - 1; ++j) {
          if (i === j) continue;
          if (denom_units[i].denom.toLowerCase() === denom_units[j].denom.toLowerCase()) {
            return true;
          }
        }
      }
      return false;
    }
    const filteredAssets5: any[] = chain_reg.find("Asset", [filter5]);

    filteredAssets5?.forEach((assetPtr) => {
      //console.log(assetPtr.parent?.object?.property("chain_name"));
      console.log(assetPtr.parent?.key);
      console.log(assetPtr.object?.property("base"));
    });

    console.log("same denom unit:");

    const filter6 = (denomUnitPtr: Pointer) => {
      const filter8 = (denomUnitPtr2: Pointer) => {
        return denomUnitPtr.key !== denomUnitPtr2.key &&
          denomUnitPtr.object?.property("denom")?.toLowerCase() === denomUnitPtr2.object?.property("denom")?.toLowerCase();
      }
      return denomUnitPtr.parent?.object?.find("DenomUnit", [filter8]).length ? true : false;
    }
    const filteredAssets6: any[] = chain_reg.find("DenomUnit", [filter6]);

    filteredAssets6?.forEach((denomUnitPtr) => {
      console.log(denomUnitPtr.parent?.parent?.key);
      console.log(denomUnitPtr.parent?.key);
      //console.log(denomUnitPtr.key);
    });

  }
  
};