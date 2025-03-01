import path from "path";
import Chain from '../types/Chain.js';
import Directory from '../types/Directory.js';
import { CONFIG } from '../config.js';

export enum NetworkType {
  MAINNETS = "mainnets",
  TESTNETS = "testnets"
}

export enum ChainType {
  COSMOS = "cosmos",
  NON_COSMOS = "non-cosmos"
}

export enum JsonFileName {
  ASSETLIST = "assetlist.json",
  CHAIN = "chain.json",
  VERSIONS = "versions.json"
}

class ChainRegistry {

  private static instance: ChainRegistry | null = null;

  private multiNetworkDirectories: { [key: string]: Directory | null } = {};

  private static NON_COSMOS_DIR_NAME = "_non-cosmos";
  private static TESTNETS_DIR_NAME = "testnets";

  private static IMAGES_DIR_NAME = "images";

  private _chainNames: Set<string> | null | undefined = null;
  private _chainNameToChainMap: Map<string, Chain> | null = null;

  private constructor() {
    this.initializeMultiNetworkDirectories();
  }

  // Singleton pattern: Only creates the instance once
  public static getInstance(): ChainRegistry {
    if (!this.instance) {
      this.instance = new ChainRegistry();
    }
    return this.instance;
  }

  private initializeMultiNetworkDirectories(): void {
    this.multiNetworkDirectories = {
      cosmosMainnets: new Directory(path.join(
        CONFIG.CHAIN_REG_ROOT_DIR, CONFIG.CHAIN_REG_DIR_NAME)),
      cosmosTestnets: new Directory(path.join(
        CONFIG.CHAIN_REG_ROOT_DIR, CONFIG.CHAIN_REG_DIR_NAME,
        ChainRegistry.TESTNETS_DIR_NAME)),
      nonCosmosMainnets: new Directory(path.join(
        CONFIG.CHAIN_REG_ROOT_DIR, CONFIG.CHAIN_REG_DIR_NAME,
        ChainRegistry.NON_COSMOS_DIR_NAME)),
      nonCosmosTestnets: new Directory(path.join(
        CONFIG.CHAIN_REG_ROOT_DIR, CONFIG.CHAIN_REG_DIR_NAME,
        ChainRegistry.TESTNETS_DIR_NAME, ChainRegistry.NON_COSMOS_DIR_NAME)),
    };
  }

  public getMultiNetworkDirectory(
    networkType: NetworkType = NetworkType.MAINNETS,
    chainType: ChainType = ChainType.COSMOS
  ): Directory | null {
    if (networkType === NetworkType.MAINNETS) {
      return chainType === ChainType.COSMOS
        ? this.multiNetworkDirectories.cosmosMainnets
        : this.multiNetworkDirectories.nonCosmosMainnets;
    }
    if (networkType === NetworkType.TESTNETS) {
      return chainType === ChainType.COSMOS
        ? this.multiNetworkDirectories.cosmosTestnets
        : this.multiNetworkDirectories.nonCosmosTestnets;
    }
    return null;
  }

  private chainNameToDirectoryMap: Map<string, Directory> | null = null;

  private createChainNameToDirectoryMap(): void {
    this.chainNameToDirectoryMap = new Map();
    Object.values(this.multiNetworkDirectories).forEach((multiNetworkDirectory) => {
      if (multiNetworkDirectory) {
        multiNetworkDirectory.contents.forEach((directoryContent) => {
          if (directoryContent instanceof Directory && directoryContent.isChain) {
            this.chainNameToDirectoryMap?.set(directoryContent.basename, directoryContent);
          }
        });
      }
    });
  }

  public getChainDirectory(chainName: string): Directory | null {
    if (!this.chainNameToDirectoryMap) {
      this.createChainNameToDirectoryMap();
    }
    return this.chainNameToDirectoryMap?.get(chainName) ?? null;
  }

  public getFileProperty(fileName: JsonFileName): void {
    console.log("LOL");
    console.log(fileName);
  }

  public chain(chainName: string): Chain | undefined {
    return this._chainNameToChainMap!.get(chainName);
  } 

}

export default ChainRegistry;
