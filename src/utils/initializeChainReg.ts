import ChainRegistry from '../types/ChainRegistry.js';
import { arrayToJson } from '../types/RegistryObject.js';
import AssetPointer from '../types/AssetPointer.js';
import { ibcTraceTypes } from '../constants/TraceConstants.js';

export const getChainRegContents = () => {

  const chain_reg = ChainRegistry.getInstance();
 

  const chain = chain_reg.chain("osmosis");
  if (chain) {
    console.log(chain.property("pretty_name"));
    console.log(chain.property("blah"));
    console.log("Assets:");
    console.log(chain.asset("uosmo")?.property("name"));
    console.log("Versions:");
    console.log(chain.version("v28")?.recommended_version);
    console.log(chain_reg.chain("cosmoshub")?.asset("uatom")?.property("description"));
    console.log("Traces:");
    console.log(chain_reg.chain("osmosis")?.
      asset("ibc/F6B691D5F7126579DDC87357B09D653B47FDCE0A3383FF33C8D8B544FE29A8A6")?.
      property("traces")
    );
    console.log("Decimals:");
    console.log(chain_reg.chain("cosmoshub")?.asset("uatom")?.property("decimals"));
    console.log("Atom:");
    console.log(chain_reg.
      chain("osmosis")?.
      asset("ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2")?.
      property("extended_description")
    );
    console.log(chain_reg.
      chain("osmosis")?.
      asset("ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2")?.
      property("extended_description", [])
    );
    console.log("USDC");
    /*console.log(chain_reg.
      chain("osmosis")?.
      asset("ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858")?.
      property("traces")
    );*/
    console.log(arrayToJson(
      chain_reg.
        chain("osmosis")?.
        asset("ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858")?.
        property("traces")));
    console.log(chain_reg.
      chain("osmosis")?.
      asset("ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858")?.
      toJSON()
    );
    console.log(
      chain_reg.
        ibcConnection("osmosis", "cosmoshub")?.
        channel()
    );
    
    console.log(
      chain_reg.
        ibcChannel(
          { "chain_name": "osmosis", "port_id": "transfer" },
          { "chain_name": "cosmoshub", "port_id": "transfer" }
        )
    );//

    const filter1 = (chainName: string) => chainName.startsWith("cosmos");
    const filter2 = (chainName: string) => chain_reg.chain(chainName)
      ?.property("bech32_prefix") === "osmo";

    chain_reg.chains([filter2])?.forEach((chainKey) => {
      console.log(chainKey);
    });

    console.log(chain_reg.chains());

    const filter3 = (asset: AssetPointer) => chain_reg.asset(asset)?.property("symbol") === "OSMO";
    console.log(chain_reg.chain("kopi"));
    console.log(chain_reg.chain("kopi")?.assets());
    //console.log(chain_reg.chain("kopi"));
    console.log(chain_reg.chain("kopi")?.assets([filter3]));

    const filteredAssets: any[] = chain_reg.assets([filter3]);

    filteredAssets?.forEach((asset) => {
      /*chain.assets().forEach((asset) => {
        const lastTrace = asset.lastTrace;
        if (ibcTraceTypes.includes(lastTrace.type)) {

        }
      });*/
      console.log(chain_reg.asset(asset)?.property("base"));
      //console.log(chain_reg.chain(chain)?.property("chain_name"));
    });

  }
  
};