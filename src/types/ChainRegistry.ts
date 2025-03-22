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
import ChainRegistryPointer from './ChainRegistryPointer.js';

class ChainRegistry extends RegistryObject {

  public get pointer(): ChainRegistryPointer { return super.pointer as ChainRegistryPointer }

  private static instance: ChainRegistry | null = null;

  public static getInstance(): ChainRegistry {
    if (!this.instance) {
      this.instance = new ChainRegistry();
    }
    return this.instance;
  }

  private constructor() {
    super(new ChainRegistryPointer());
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

  //--Multi Directories--
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
  //--

  //--Chain--
  private _chainNameToChainMap: Map<string, Chain | null> | null = null;

  private get chainNameToChainMap(): Map<string, Chain | null> | undefined {
    if (this._chainNameToChainMap === null) this.loadChainNames();
    return this._chainNameToChainMap ?? undefined;
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

  public chain(chainName: string): Chain | undefined {
    if (!this.chainNameToChainMap) return undefined;
    if (!this.chainNameToChainMap.has(chainName)) return undefined;
    let chainInstance = this.chainNameToChainMap.get(chainName);
    if (chainInstance === null) {
      const directory = this.findChainDirectory(chainName);
      if (directory) {
        chainInstance = new Chain(this.pointer, directory);
        this.chainNameToChainMap.set(chainName, chainInstance);
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

  private findChainDirectory(name: string): Directory | undefined {
    return Object.values(this._multiChainDirectories)
      .map((multiChainDirectory) => multiChainDirectory?.find(name, Directory))
      .find((dir) => dir?.isChain);
  }
  //--

  //--Asset--
  public assets(conditions?: Array<(item: AssetPointer) => boolean>, chainConditions?: Array<(item: string) => boolean>,): AssetPointer[] {
    return this.chains(chainConditions).flatMap(chainKey =>
      ChainRegistry.getInstance().chain(chainKey)?.assets(conditions) ?? []
    );
  }

  public asset(assetPointer: AssetPointer | undefined): Asset | undefined {
    if (!assetPointer) return undefined;
    return this.
      chain(assetPointer.parent.key)?.
      asset(assetPointer.key);
  }
  //--

  //--IBC Connection--
  private _ibcConnectionsMap: Map<string, IbcConnection | null> | null = null;

  private get ibcConnectionsMap(): Map<string, IbcConnection | null> | undefined {
    if (this._ibcConnectionsMap === null) this.loadIbcConnectionNames();
    return this._ibcConnectionsMap ?? undefined;
  }

  private loadIbcConnectionNames(): void {
    if (this._ibcConnectionsMap !== null) return;
    this._ibcConnectionsMap = new Map();
    Object.values(this._ibcDirectories).forEach((ibcDirectory) => {
      ibcDirectory?.contents.forEach((directoryContent) => {
        if (directoryContent instanceof File && directoryContent.basename.endsWith('.json')) {
          const ibcConnectionKey = directoryContent.basename.replace(".json", "");
          this._ibcConnectionsMap!.set(ibcConnectionKey, null);
        }
      });
    });
  }

  public ibcConnection(connectionName: string, chainNameB?: string): IbcConnection | undefined {
    const ibcConnectionKey = chainNameB ? IbcConnection.chainNamesToKey(connectionName, chainNameB) : connectionName; 
    if (!this.ibcConnectionsMap?.has(ibcConnectionKey)) return undefined;

    let ibcConnection = this.ibcConnectionsMap.get(ibcConnectionKey); //Use mapped connection, if exists
    if (ibcConnection !== null) return ibcConnection;

    let ibcFile: File | undefined; //Find the file
    for (const ibcDirectory of Object.values(this._ibcDirectories)) { //Check both IBC Directories (mainnet & testnet)
      if (!ibcDirectory) continue;
      const ibcFileName = ibcConnectionKey + ".json";
      ibcFile = ibcDirectory.find(ibcFileName, File);
      if (ibcFile) break;
    }
    if (!ibcFile) return undefined;

    ibcConnection = new IbcConnection(this.pointer, ibcConnectionKey, ibcFile); //Save New IbcConnection to Map
    this.ibcConnectionsMap.set(ibcConnectionKey, ibcConnection);
    
    return this.ibcConnectionsMap.get(ibcConnectionKey) || undefined;
  }

  public ibcConnections(conditions?: Array<(item: string) => boolean>): string[] {
    const array = Array.from(this.ibcConnectionsMap?.keys() || []);
    return RegistryObject.objects<string>(array, conditions);
  }
  //--

  //--IBC Channel
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
  //--

}

export default ChainRegistry;