import ChainRegistry from '../types/ChainRegistry.js';
import { arrayToJson } from '../types/RegistryObject.js';
import IbcChannel from '../types/IbcChannel.js';
import IbcConnection from '../types/IbcConnection.js';
import IbcChannelParty from '../types/IbcChannelParty.js';
import Chain from '../types/Chain.js';
import Asset from '../types/Asset.js';
import Version from '../types/Version.js';
import NewPointer from '../types/NewPointer.js';
import { CosmosChainRegistry, CosmosChainRegistryTypes } from '../registries/CosmosChainRegistry.js';

export const getChainRegContents = () => {

  //console.log("starting chain reg");
  const chain_reg = ChainRegistry.getInstance(CosmosChainRegistry);
  //console.log("started");
 

  const chain = chain_reg.get(Chain, "osmosis") as Chain;
  console.log("chain");
  //console.log(chain)
  if (chain) {
    console.log(chain.property("pretty_name")); // Osmosis
    console.log(chain.property("blah")); // undefined
    console.log("Assets:");
    //const asset = chain.get(Asset, "uosmo") as Asset;
    //console.log(asset);
    console.log(chain.get(Asset, "uosmo")?.property("name"));
    console.log(chain_reg.get(Chain, "osmosis")?.get(Asset, "uosmo")?.property("name"));
    //console.log(chain.asset("uosmo")?.property("name"));
    console.log("Versions:");
    //console.log(chain?.get(Version, "v28"));
    //console.log(chain?.get(Version, "v28")?.property("recommended_version"));
    console.log(chain_reg.get(Chain, "osmosis")?.get(Version, "v28")?.property("recommended_version"));
    //console.log(chain.version("v28")?.recommended_version);
    console.log(chain_reg.get(Chain, "cosmoshub")?.get(Asset, "uatom")?.property("description"));
    //console.log(chain_reg.chain("cosmoshub")?.asset("uatom")?.property("description"));
    //console.log(chain_reg);
    console.log("Traces:");
    console.log(chain_reg.get(Chain, "osmosis")?.
      get(Asset, "ibc/F6B691D5F7126579DDC87357B09D653B47FDCE0A3383FF33C8D8B544FE29A8A6")?. 
      property(Asset.PropertyName.TRACES)
    );
    console.log("Decimals:");
    console.log(chain_reg.
      get(Chain, "cosmoshub")?.
      get(Asset, "uatom")?.
      property(Asset.DerivedPropertyName.DECIMALS)
    );
    //console.log(chain_reg.chain("cosmoshub")?.asset("uatom")?.property("decimals"));
    console.log("Atom:");
    console.log(chain_reg.
      get(Chain, "osmosis")?.
      get(Asset, "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2")?.
      property(Asset.PropertyName.EXTENDED_DESCRIPTION)
    );
    /*console.log(chain_reg.
      get(Chain, "osmosis")?.
      get(Asset, "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2")?.
      property(Asset.PropertyName.TRACES)?.[0]?.assetPointer.object.property(Asset.PropertyName.EXTENDED_DESCRIPTION)
    );*/
    /*console.log(chain_reg.
      chain("osmosis")?.
      asset("ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2")?.
      property("extended_description")
    );*/


    console.log(chain_reg.
      get(Chain, "osmosis")?.
      get(Asset, "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2")?.
      property(Asset.PropertyName.EXTENDED_DESCRIPTION, [])
    );
    /*console.log(chain_reg.
      chain("osmosis")?.
      asset("ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2")?.
      property("extended_description", [])
    );*/

    /*console.log("USDC");
    console.log(arrayToJson(
      chain_reg.
      get(Chain, "osmosis")?.
      get(Asset, "ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858")?.
      property(Asset.PropertyName.TRACES)
    ));*/

    console.log(chain_reg.
      get(Chain, "osmosis")?.
      get(Asset, "ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858")?.
      toJSON()
    );


    /*console.log(
      chain_reg.
        ibcConnection("osmosis", "cosmoshub")?.
        channel()
    );*/



    /*const filter2 = (chainKey: Chain["keyType"]) => chain_reg.get(Chain, chainKey)
      ?.property(Chain.PropertyName.BECH32_PREFIX) === "osmo";
    chain_reg.chains([filter2])?.forEach((chainKey) => {
      console.log(chainKey);
    });*/
    const filter25 = (chainPointer: NewPointer<Chain>) => chainPointer.object
      ?.property(Chain.PropertyName.BECH32_PREFIX) === "osmo";

    chain_reg.find(Chain, [filter25])?.forEach((chainPointer: NewPointer<Chain>) => {
      console.log(chainPointer.object?.property(Chain.PropertyName.CHAIN_NAME));
    });

    console.log("Done");

    //console.log(chain_reg.chains());

    //const filter3 = (asset: AssetPointer) => chain_reg.asset(asset)?.property("symbol") === "OSMO";
    const filter3 = (assetPointer: NewPointer<Asset>) =>
      assetPointer.object?.property(Asset.PropertyName.SYMBOL) === "OSMO";
    /*console.log(chain_reg.chain("kopi"));
    console.log(chain_reg.chain("kopi")?.assets());
    console.log(chain_reg.chain("kopi")?.assets([filter3]));*/

    //const filteredAssets: any[] = chain_reg.assets([filter3]);
    const filteredAssets: any[] = chain_reg.find(Asset, [filter3]);
    //console.log(filteredAssets);

    filteredAssets?.forEach((assetPtr) => {
      console.log(assetPtr.object?.property("base"));
    });


    //Q: Which assets have a two denoms where they are are the same letters just with different letter casing?
    /*console.log("same denom unit:");
    const filter5 = (assetPointer: NewPointer<Asset>) => {
      const denom_units = assetPointer.object?.property(Asset.PropertyName.DENOM_UNITS)
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
    const filteredAssets5: any[] = chain_reg.find(Asset, [filter5]);

    filteredAssets5?.forEach((assetPtr) => {
      console.log(assetPtr.parent?.object?.property(Chain.PropertyName.CHAIN_NAME));
      console.log(assetPtr.object?.property(Asset.PropertyName.BASE));
    });*/

    /*console.log("IBC Connections:");
   
    const filteredConnections45: any[] = chain_reg.find(IbcConnection, [()=>true]);
    filteredConnections45?.forEach((ptr) => {
      console.log(ptr.object?.property(IbcConnection.PropertyName.CHAIN_1));
      console.log(ptr.object?.property(IbcConnection.PropertyName.CHAIN_2));
    });*/


    console.log("IBC Connection");
    const connection = chain_reg.get(IbcConnection, "juno-osmosis");
    //console.log(connection);
    console.log(connection?.property("chain_1"));
    console.log("IBC Channel");
    const channel = connection?.get(IbcChannel, 1);
    //console.log(channel);
    console.log(channel?.property("chain_1"));
    /*const property = chain_reg.get(IbcConnection, "juno-osmosis")?.get(IbcChannel, 1)?.property(IbcChannel.PropertyName.CHAIN_1);
    console.log(property);*/
    
    

    /*console.log("IBC Channels:");
    const filter4 = (ptr: NewPointer<IbcChannel>) =>
      (
        ptr.object?.property(IbcChannel.PropertyName.CHAIN_1)[IbcChannelParty.PropertyName.CHANNEL_ID] === "channel-0" || 
        ptr.object?.property(IbcChannel.PropertyName.CHAIN_2)[IbcChannelParty.PropertyName.CHANNEL_ID] === "channel-0"
      ) &&
      (
        ptr.object?.property(IbcChannel.PropertyName.CHAIN_1)[IbcChannelParty.PropertyName.PORT_ID] === "transfer" ||
        ptr.object?.property(IbcChannel.PropertyName.CHAIN_2)[IbcChannelParty.PropertyName.PORT_ID] === "transfer"
      )// &&
      //channel.property(IbcChannel.TAGS)?.status === "live";
      //channel.property(IbcChannel.CHAIN_1)?.port_id === "transfer";
    const filteredChannels4: any[] = chain_reg.find(IbcChannel, [filter4]);
    filteredChannels4?.forEach((ptr) => {
      console.log(ptr.parent?.object?.property(IbcConnection.PropertyName.CHAIN_1));
      console.log(ptr.parent?.object?.property(IbcConnection.PropertyName.CHAIN_2));
      console.log(ptr.object?.property(IbcChannel.PropertyName.CHAIN_1).property(IbcChannelParty.PropertyName.CHANNEL_ID));
      console.log(ptr.object?.property(IbcChannel.PropertyName.CHAIN_2).property(IbcChannelParty.PropertyName.CHANNEL_ID));
    });*/

  }
  
};