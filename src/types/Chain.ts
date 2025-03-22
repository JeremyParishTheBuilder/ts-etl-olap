import Directory from './Directory.js';
import File from './File.js';
import RegistryObject from './RegistryObject.js';
import ChainPointer from './ChainPointer.js';
import Asset from './Asset.js';
import AssetPointer from './AssetPointer.js';
import Version from './Version.js';

class Chain extends RegistryObject {

  //private _chainName: string;
  private _directory: Directory;

  public get pointer(): ChainPointer { return super.pointer as ChainPointer; }

  public constructor(parent: InstanceType<typeof ChainPointer>["parent"], directory: Directory) {
    super(new ChainPointer(parent, directory.basename));
    this._directory = directory;
    //this._chainName = directory.basename;
  }

  protected fetchJsonProperties(): Record<string, any> | null {
    return this.file(Chain.FileName.CHAIN)?.contents || {};
  }

  //--Key Files and Directories--
  private _keyFiles: Map<string, File | undefined> = new Map(); //Stores Files like: Assetlist, Chain & Versions.
  private _keyDirectories: Map<string, Directory | undefined> = new Map(); //Stores Directories like: /images/.

  public static readonly FileName = {
    ASSETLIST: "assetlist.json",
    CHAIN: "chain.json",
    VERSIONS: "versions.json"
  }
  public static readonly DirectoryName = {
    IMAGES: "images"
  }

  public file(name: string): File | undefined {
    if (!Object.values(Chain.FileName).includes(name)) return undefined;
    if (!this._keyFiles.has(name)) this._keyFiles.set(name, this._directory.find(name, File));
    return this._keyFiles.get(name);
  }
  public directory(name?: string): Directory | undefined {
    if (!name) return this._directory;
    if (!Object.values(Chain.DirectoryName).includes(name)) return undefined;
    if (!this._keyDirectories.has(name)) this._keyDirectories.set(name, this._directory.find(name, Directory));
    return this._keyDirectories.get(name);
  }
  //--

  //--Assets--
  private _baseDenomToAssetMap: Map<string, Asset | null | undefined> | null = null;

  public assets(conditions?: Array<(item: AssetPointer) => boolean>): AssetPointer[] {
    if (this._baseDenomToAssetMap === null) this.loadBaseDenoms();
    if (!this._baseDenomToAssetMap) return [];
    const array = Array.from(this._baseDenomToAssetMap.keys())
      .map((asset) => new AssetPointer(this.pointer, asset));
    return RegistryObject.objects<AssetPointer>(array, conditions);
  }

  public asset(baseDenom: string): Asset | undefined {
    if (!this._baseDenomToAssetMap) this.loadBaseDenoms(); // Ensure it's initialized
    if (!this._baseDenomToAssetMap?.has(baseDenom)) return undefined; // Base denom doesn't exist
    if (this._baseDenomToAssetMap.get(baseDenom) === null) {
      //this._baseDenomToAssetMap.set(baseDenom, new Asset(this._chainName, baseDenom)); // Lazy-load asset
      this._baseDenomToAssetMap.set(baseDenom, new Asset(this.pointer, baseDenom)); // Lazy-load asset
    }
    return this._baseDenomToAssetMap.get(baseDenom) || undefined;
  }

  private loadBaseDenoms(): void {
    if (this._baseDenomToAssetMap !== null) return; // Already initialized
    const assetlistFile = this.file(Chain.FileName.ASSETLIST);
    if (!assetlistFile?.contents?.assets) {
      this._baseDenomToAssetMap = new Map(); // No assets found, but still initialize the Map
      return;
    }
    const assetArray: { base: string }[] = assetlistFile.contents.assets || [];
    this._baseDenomToAssetMap = new Map(assetArray.map(asset => [asset.base, null]));
  }
  //--

  //--Versions--
  private _versionNameToVersionMap: Map<string, Version | null | undefined> | null = null;

  public version(versionName: string): Version | null | undefined {
    if (!this._versionNameToVersionMap) this.loadVersionNames(); // Ensure it's initialized
    if (!this._versionNameToVersionMap?.has(versionName)) return undefined; // Base denom doesn't exist
    if (this._versionNameToVersionMap.get(versionName) === null) {
      this._versionNameToVersionMap.set(versionName, new Version(this.pointer.key, versionName)); // Lazy-load asset
    }
    return this._versionNameToVersionMap.get(versionName);
  }

  private loadVersionNames(): void {
    if (this._versionNameToVersionMap !== null) return; // Already initialized
    const versionFile = this.file(Chain.FileName.VERSIONS);
    if (!versionFile?.contents?.versions) {
      this._versionNameToVersionMap = new Map(); // No versions found, but still initialize the Map
      return;
    }
    const versionArray: { name: string }[] = versionFile.contents.versions || [];
    this._versionNameToVersionMap = new Map(versionArray.map(version => [version.name, null]));
  }
  //--

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
    return this.pointer.key; //by directory name, not JSON property--some chains don't have chain json
  }

  private get networkType(): string {
    if (this.chainName.includes(Chain.NetworkType.TESTNET)) return Chain.NetworkType.TESTNET;
    if (this.chainName.includes(Chain.NetworkType.DEVNET)) return Chain.NetworkType.DEVNET;
    return Chain.NetworkType.MAINNET;
  }
  //--

}

export default Chain;