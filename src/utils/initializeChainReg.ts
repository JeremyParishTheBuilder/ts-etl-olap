import ChainRegistry from '../types/ChainRegistry.js';
import { NetworkType, ChainType, JsonFileName } from '../types/ChainRegistry.js'; 
import Chain from '../types/Chain.js';

export const getChainRegContents = () => {

  const chain_reg = ChainRegistry.getInstance();
 
  const cosmosMainnets = chain_reg.getMultiNetworkDirectory();
  cosmosMainnets?.logContents();

  const cosmosTestnets = chain_reg.getMultiNetworkDirectory(NetworkType.TESTNETS, ChainType.COSMOS);
  console.log(cosmosTestnets?.isChain);

  chain_reg.getFileProperty(JsonFileName.ASSETLIST);

  console.log(chain_reg.getChainDirectory("osmosis")?.basename);

  let chain;
  const osmosisChainDir = chain_reg.getChainDirectory("osmosis");
  //const osmosisChain = chain_reg.getChain("osmosis");
  if (osmosisChainDir) {
    chain = new Chain(osmosisChainDir);
    console.log(chain.pretty_name);
    console.log(chain.blah);
    console.log("Assets:");
    //console.log(chain.base_denoms);
    //console.log(chain.asset("uosmo"));
    console.log(chain.asset("uosmo")?.name);
  }
  
  //console.log(chain_reg.getFileProperty(JsonFileName.CHAIN, ));

};