import ChainRegistry from "../types/ChainRegistry.js";
import { NetworkType, ChainType, JsonFileName } from "../types/ChainRegistry.js"; 

export const getChainRegContents = () => {

  const chain_reg = ChainRegistry.getInstance();
 
  const cosmosMainnets = chain_reg.getMultiNetworkDirectory();
  cosmosMainnets?.logContents();

  const cosmosTestnets = chain_reg.getMultiNetworkDirectory(NetworkType.TESTNETS, ChainType.COSMOS);
  console.log(cosmosTestnets?.isChainDirectory());

  chain_reg.getFileProperty(JsonFileName.assetlist);

  console.log(chain_reg.getChainDirectory("osmosis")?.basename);


};