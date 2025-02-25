import ChainRegistry from "../types/ChainRegistry.js";
import { NetworkType, ChainType, JsonFileName } from "../types/ChainRegistry.js"; 

export const getChainRegContents = () => {

  const chain_reg = ChainRegistry.getInstance();
 
  const cosmosMainnets = chain_reg.getNetworksDirectory();
  cosmosMainnets?.logContents();

  const cosmosTestnets = chain_reg.getNetworksDirectory(NetworkType.TESTNETS, ChainType.COSMOS);
  console.log(cosmosTestnets?.isChainDirectory());

  chain_reg.getFileProperty(JsonFileName.assetlist);


};