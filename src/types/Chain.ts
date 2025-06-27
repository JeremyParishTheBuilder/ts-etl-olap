import Directory from './Directory.js';
import File from './File.js';
import RegistryObject from './RegistryObject.js';
import Asset from './Asset.js';
//import Version from './Version.js';
import NewPointer from './NewPointer.js';
import Container from './Container.js';
//import ChainRegistry from './ChainRegistry.js';

export type ChainKeyType = string;

class Chain extends RegistryObject {

  private _directory: Directory | undefined | null = null;

  //public keyType: string = "";

  public constructor(
    parentPointer: NewPointer | null,
    key: string,
    json: Record<string, any> | null = null,
    directory: Directory | undefined | null = null
  ) {
    super(new NewPointer(parentPointer, key, "Chain"), json);
    this._directory = directory;
  }

  public static readonly PropertyName = {
    CHAIN_NAME: "chain_name",
    CHAIN_TYPE: "chain_type",
    NETWORK_TYPE: "network_type",
    BECH32_PREFIX: "bech32_prefix",
    CODEBASE: "codebase",
    ENDPOINTS: "endpoints"
  }

  /*protected fetchJsonProperties(): Record<string, any> | null {
    return this.file(Chain.FileName.CHAIN)?.contents || {};
  }*/

  public static readonly FileName = {
    ASSETLIST: "assetlist.json",
    CHAIN: "chain.json",
    VERSIONS: "versions.json"
  }
  public get FileName() {
    return Chain.FileName;
  }

  /*public override file(name: string): File | undefined {
    if (!Object.values(this.FileName).includes(name)) return undefined;
    if (!this._keyFiles.has(name)) this._keyFiles.set(name, this.directory()?.find(name, File));
    return this._keyFiles.get(name);
  }*/

  public static readonly DirectoryName = {
    IMAGES: "images"
  }
  public get DirectoryName() {
    return Chain.FileName;
  }

  /*public override directory(name?: string): Directory | null | undefined {
    if (this._directory === null) {
      this._directory = (this.pointer.parent.object as ChainRegistry)?.findChainDirectory(this.pointer.key);
    }
    if (!this._directory) return undefined;
    if (!name) return this._directory;
    if (!Object.values(this.DirectoryName).includes(name)) return undefined;
    if (!this._keyDirectories.has(name)) this._keyDirectories.set(name, this._directory?.find(name, Directory));
    return this._keyDirectories.get(name);
  }*/

  //--Property Values--
  public static readonly NetworkType = {
    MAINNET: "mainnet",
    TESTNET: "testnet",
    DEVNET: "devnet"
  }
  public static readonly ChainType = {
    COSMOS: "cosmos",
    NON_COSMOS: "non-cosmos",
  }
  //--

  //--Derived Properties--
  public static readonly DerivedPropertyName = {
    CHAIN_NAME: "chain_name",
    NETWORK_TYPE: "network_type"
  }
  public get DerivedPropertyName() {
    return Chain.DerivedPropertyName
  }

  public derivedProperty(propertyName: string): any | undefined {
    if (!this._derivedProperties) return undefined;

    if (propertyName === this.DerivedPropertyName.CHAIN_NAME) {
      return this._derivedProperties[propertyName] = this.chainName;
    }

    if (propertyName === this.DerivedPropertyName.NETWORK_TYPE) {
      return this._derivedProperties[propertyName] = this.networkType;
    }

    //Add checks for additional derived properties here...

  }

  private get chainName(): string {
    return this.pointer.key as string; //by directory name, not JSON property--some chains don't have chain json
  }

  private get networkType(): string {
    if (this.chainName.includes(Chain.NetworkType.TESTNET)) return Chain.NetworkType.TESTNET;
    if (this.chainName.includes(Chain.NetworkType.DEVNET)) return Chain.NetworkType.DEVNET;
    return Chain.NetworkType.MAINNET;
  }
  //--

}

export default Chain;