import path from "path";
import Chain from '../types/Chain.js';
import Asset from '../types/Asset.js';
import Directory from '../types/Directory.js';
import { NetworkTypeDirName, ChainTypeDirName } from '../constants/ChainConstants.js';
import CONFIG from '../config.js';
import AssetPointer from "./AssetPointer.js";

class ChainRegistry {

  private static instance: ChainRegistry | null = null;

  private _multiChainDirectories: { [key: string]: Directory | null } = {};

  private static NON_COSMOS_DIR_NAME = "_non-cosmos";
  private static TESTNETS_DIR_NAME = "testnets";

  private constructor() {
    this.initializeMultiChainDirectories();
  }

  // Singleton pattern: Only creates the instance once
  public static getInstance(): ChainRegistry {
    if (!this.instance) {
      this.instance = new ChainRegistry();
    }
    return this.instance;
  }

  private initializeMultiChainDirectories(): void { //structure of chain directories
    this._multiChainDirectories = {
      cosmosMainnets: new Directory(path.join(
        CONFIG.CHAIN_REG_ROOT_DIR, CONFIG.CHAIN_REG_DIR_NAME,
        NetworkTypeDirName.MAINNET,
        ChainTypeDirName.COSMOS
      )),
      cosmosTestnets: new Directory(path.join(
        CONFIG.CHAIN_REG_ROOT_DIR, CONFIG.CHAIN_REG_DIR_NAME,
        NetworkTypeDirName.TESTNET,
        ChainTypeDirName.COSMOS
      )),
      nonCosmosMainnets: new Directory(path.join(
        CONFIG.CHAIN_REG_ROOT_DIR, CONFIG.CHAIN_REG_DIR_NAME,
        NetworkTypeDirName.MAINNET,
        ChainTypeDirName.NON_COSMOS
      )),
      nonCosmosTestnets: new Directory(path.join(
        CONFIG.CHAIN_REG_ROOT_DIR, CONFIG.CHAIN_REG_DIR_NAME,
        NetworkTypeDirName.TESTNET,
        ChainTypeDirName.NON_COSMOS
      )),
    };
  }

  public multiChainDirectory(
    networkType: NetworkTypeDirName = NetworkTypeDirName.MAINNET,
    chainType: ChainTypeDirName = ChainTypeDirName.COSMOS
  ): Directory | null {
    if (networkType === NetworkTypeDirName.MAINNET) {
      return chainType === ChainTypeDirName.COSMOS
        ? this._multiChainDirectories.cosmosMainnets
        : this._multiChainDirectories.nonCosmosMainnets;
    }
    if (networkType === NetworkTypeDirName.TESTNET) {
      return chainType === ChainTypeDirName.COSMOS
        ? this._multiChainDirectories.cosmosTestnets
        : this._multiChainDirectories.nonCosmosTestnets;
    }
    return null;
  }

  

  private _chainNameToChainMap: Map<string, Chain | null> | null = null;

  public chain(chainName: string): Chain | undefined {
    if (!this._chainNameToChainMap) this.loadChainNames();
    const chainMap = this._chainNameToChainMap;
    if (!chainMap?.has(chainName)) return undefined;
    let chainInstance = chainMap.get(chainName);
    if (chainInstance === null) {
      const directory = this.findChainDirectory(chainName);
      if (directory) {
        chainInstance = new Chain(directory);
        this._chainNameToChainMap!.set(chainName, chainInstance);
      }
    }
    return chainInstance!;
  }

  private loadChainNames(): void {
    if (this._chainNameToChainMap !== null) return;
    this._chainNameToChainMap = new Map();
    Object.values(this._multiChainDirectories).forEach((multiChainDirectory) => {
      multiChainDirectory?.contents.forEach((directoryContent) => {
        if (directoryContent instanceof Directory && directoryContent.isChain) {
          this._chainNameToChainMap!.set(directoryContent.basename, null);
        }
      });
    });
  }

  public asset(assetPointer: AssetPointer): Asset | undefined {
    return this.
      chain(assetPointer.chainName)?.
      asset(assetPointer.baseDenom);
  }

  private findChainDirectory(name: string): Directory | undefined {
    return Object.values(this._multiChainDirectories)
      .map((multiChainDirectory) => multiChainDirectory?.find(name, Directory))
      .find((dir) => dir?.isChain);
  }


}

export default ChainRegistry;
