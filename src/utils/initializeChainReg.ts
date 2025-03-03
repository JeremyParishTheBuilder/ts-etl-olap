import ChainRegistry from '../types/ChainRegistry.js';

export const getChainRegContents = () => {

  const chain_reg = ChainRegistry.getInstance();
 

  const chain = chain_reg.chain("osmosis");
  if (chain) {
    console.log(chain.pretty_name);
    console.log(chain.blah);
    console.log("Assets:");
    //console.log(chain.base_denoms);
    //console.log(chain.asset("uosmo"));
    console.log(chain.asset("uosmo")?.name);
    console.log("Versions:");
    //console.log(chain.version("v28"));
    console.log(chain.version("v28")?.recommended_version);
    console.log(chain_reg.chain("cosmoshub")?.asset("uatom")?.description);
  }
  
};