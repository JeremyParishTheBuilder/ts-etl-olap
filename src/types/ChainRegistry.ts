import path from "path";
import Chain from '../types/Chain.js';
import Asset from '../types/Asset.js';
import Directory from '../types/Directory.js';
import CONFIG from '../config.js';
import AssetPointer from './AssetPointer.js';
import IbcConnection from './IbcConnection.js';
import IbcChannel from './IbcChannel.js';
import File from './File.js';
import RegistryObject from './RegistryObject.js';

class ChainRegistry {

  private static instance: ChainRegistry | null = null;

  public static getInstance(): ChainRegistry {
    if (!this.instance) {
      this.instance = new ChainRegistry();
    }
    return this.instance;
  }

  private constructor() {
    this.initializeMultiChainDirectories();
  }

  private _multiChainDirectories: { [key: string]: Directory | null } = {};
  private _ibcDirectories: { [key: string]: Directory | undefined } = {};

  private initializeMultiChainDirectories(): void {
    const testnetsDirName: string = "testnets";
    const nonCosmosDirName: string = "_non-cosmos";
    const ibcDirName: string = "_IBC";

    this._multiChainDirectories = {
      cosmosMainnets: new Directory(path.join(
        CONFIG.CHAIN_REG_ROOT_DIR, CONFIG.CHAIN_REG_DIR_NAME
      )),
      cosmosTestnets: new Directory(path.join(
        CONFIG.CHAIN_REG_ROOT_DIR, CONFIG.CHAIN_REG_DIR_NAME,
        testnetsDirName
      )),
      nonCosmosMainnets: new Directory(path.join(
        CONFIG.CHAIN_REG_ROOT_DIR, CONFIG.CHAIN_REG_DIR_NAME,
        nonCosmosDirName
      )),
      nonCosmosTestnets: new Directory(path.join(
        CONFIG.CHAIN_REG_ROOT_DIR, CONFIG.CHAIN_REG_DIR_NAME,
        testnetsDirName,
        nonCosmosDirName
      )),
    };
    this._ibcDirectories = {
      mainnet: new Directory(path.join(
        CONFIG.CHAIN_REG_ROOT_DIR, CONFIG.CHAIN_REG_DIR_NAME,
        ibcDirName
      )),
      testnet: new Directory(path.join(
        CONFIG.CHAIN_REG_ROOT_DIR, CONFIG.CHAIN_REG_DIR_NAME,
        testnetsDirName,
        ibcDirName
      )),
    };
  }

  
  public multiChainDirectory(
    networkType: string = Chain.NetworkType.MAINNET,
    chainType: string = Chain.ChainType.COSMOS
  ): Directory | null {
    if (networkType === Chain.NetworkType.MAINNET) {
      return chainType === Chain.ChainType.COSMOS
        ? this._multiChainDirectories.cosmosMainnets
        : this._multiChainDirectories.nonCosmosMainnets;
    }
    if (networkType === Chain.NetworkType.TESTNET) {
      return chainType === Chain.ChainType.COSMOS
        ? this._multiChainDirectories.cosmosTestnets
        : this._multiChainDirectories.nonCosmosTestnets;
    }
    return null;
  }

  public ibcDirectory(networkType: string = Chain.NetworkType.MAINNET): Directory | undefined {
    if (networkType === Chain.NetworkType.MAINNET) return this._ibcDirectories.mainnet;
    if (networkType === Chain.NetworkType.TESTNET || Chain.NetworkType.DEVNET) return this._ibcDirectories.testnet;
    return undefined;
  }

  

  private _chainNameToChainMap: Map<string, Chain | null> | null = null;

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

  public chain(chainName: string): Chain | undefined {
    if (!this._chainNameToChainMap) this.loadChainNames();
    if (!this._chainNameToChainMap) return undefined;
    const chainMap = this._chainNameToChainMap;
    if (!chainMap?.has(chainName)) return undefined;
    let chainInstance = chainMap.get(chainName);
    if (chainInstance === null) {
      const directory = this.findChainDirectory(chainName);
      if (directory) {
        chainInstance = new Chain(directory);
        this._chainNameToChainMap.set(chainName, chainInstance);
      }
    }
    return chainInstance ?? undefined;
  }

  public chains(conditions?: Array<(item: string) => boolean>): string[] {
    if (this._chainNameToChainMap === null) this.loadChainNames();
    if (!this._chainNameToChainMap) return [];
    const array = Array.from(this._chainNameToChainMap.keys());
    return RegistryObject.objects<string>(array, conditions);
  }

  public assets(conditions?: Array<(item: AssetPointer) => boolean>, chainConditions?: Array<(item: string) => boolean>,): AssetPointer[] {
    return this.chains(chainConditions).flatMap(chainKey =>
      ChainRegistry.getInstance().chain(chainKey)?.assets(conditions) ?? []
    );
  }

  private findChainDirectory(name: string): Directory | undefined {
    return Object.values(this._multiChainDirectories)
      .map((multiChainDirectory) => multiChainDirectory?.find(name, Directory))
      .find((dir) => dir?.isChain);
  }

  public asset(assetPointer: AssetPointer | undefined): Asset | undefined {
    if (!assetPointer) return undefined;
    return this.
      chain(assetPointer.chainName)?.
      asset(assetPointer.baseDenom);
  }

  private _ibcConnectionsMap: Map<string, IbcConnection | null> | null = null;

  private loadIbcConnectionNames(): void {
    if (this._ibcConnectionsMap !== null) return; // Prevent redundant loading

    this._ibcConnectionsMap = new Map();

    Object.values(this._ibcDirectories).forEach((ibcDirectory) => {
      if (!ibcDirectory) return;

      ibcDirectory.contents.forEach((directoryContent) => {
        if (directoryContent instanceof File && directoryContent.basename.endsWith('.json')) {
          this._ibcConnectionsMap!.set(directoryContent.basename, null); // Initialize as null
        }
      });
    });
  }


  public ibcConnection(chainNameA: string, chainNameB: string): IbcConnection | undefined {
    if (!chainNameA || !chainNameB) return undefined;

    if (!this._ibcConnectionsMap) this.loadIbcConnectionNames();

    // Ensure chain names are sorted alphabetically
    const [chain1, chain2] = [chainNameA, chainNameB].sort();
    const ibcFileName = `${chain1}-${chain2}.json`;

    if (!this._ibcConnectionsMap!.has(ibcFileName)) return undefined;

    let ibcInstance = this._ibcConnectionsMap!.get(ibcFileName);
    if (ibcInstance === null) {
      let ibcFile: File | undefined;

      // Check both IBC directories (mainnet and testnet)
      for (const ibcDirectory of Object.values(this._ibcDirectories)) {
        if (!ibcDirectory) continue;

        ibcFile = ibcDirectory.find(ibcFileName, File);
        if (ibcFile) break;
      }
      if (ibcFile) {
        ibcInstance = new IbcConnection(ibcFile.contents);
        this._ibcConnectionsMap!.set(ibcFileName, ibcInstance);
      } else {
        // If no file is found, keep it as null to avoid redundant searches
        this._ibcConnectionsMap!.set(ibcFileName, null);
      }
      return this._ibcConnectionsMap!.get(ibcFileName) || undefined;
    }

    return ibcInstance || undefined;
  }

  public ibcChannel(chainA: Record<string, string>, chainB: Record<string, string>): IbcChannel | undefined {
    if (!chainA?.chain_name || !chainB?.chain_name) return undefined;

    // Sort chains by name
    const [chain1Name, chain2Name] = [chainA.chain_name, chainB.chain_name].sort();

    // Retrieve IBC connection
    const ibcConnection = this.ibcConnection(chain1Name, chain2Name);
    if (!ibcConnection) return undefined;

    // Assign chain1 and chain2 based on sorted order
    const [chain1, chain2] = chain1Name === chainA.chain_name ? [chainA, chainB] : [chainB, chainA];

    return ibcConnection.channel(chain1, chain2);
  }

}

export default ChainRegistry;