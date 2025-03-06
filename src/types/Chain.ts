import Directory from './Directory.js';
import File from './File.js';
import { ChainFileName, ChainDirName } from '../constants/ChainConstants.js';
import Asset from './Asset.js'; 
import Version from './Version.js';

export class Chain {

  private _chainName: string;
  private _directory: Directory;
  private _properties: Record<string, any> | null | undefined = null; // Stores JSON properties

  private _keyFiles: Map<ChainFileName, File | undefined> = new Map(); //Stores Files like: Assetlist, Chain & Versions.
  private _keyDirectories: Map<ChainDirName, Directory | undefined> = new Map(); //Stores Directories like: /images/.

  private _baseDenomToAssetMap: Map<string, Asset | null | undefined> | null = null;
  private _versionNameToVersionMap: Map<string, Version | null | undefined> | null = null;

  [key: string]: any;

  public constructor(directory: Directory) {
    this._directory = directory;
    this._chainName = directory.basename;

    return new Proxy(this, {
      get: (target, prop: string) => {
        if (prop in target) return (target as any)[prop];
        if (target._properties === null) {
          target.loadProperties();
        }
        return target._properties?.[prop];
      },
    });
  }

  private loadProperties(): void {
    if (this._properties !== null) return;
    const chainFile = this.file(ChainFileName.CHAIN);
    this._properties = chainFile ? (chainFile.contents || {}) : undefined;
  }

  public get chainName(): string {
    return this._chainName; //by directory name, not JSON property--some chains don't have chain json
  }

  public file(name: ChainFileName): File | undefined {
    if (!this._keyFiles.has(name)) {
      this._keyFiles.set(name, this._directory.find(name, File));
    }
    return this._keyFiles.get(name);
  }

  public directory(name: ChainDirName): Directory | undefined {
    if (!this._keyDirectories.has(name)) {
      this._keyDirectories.set(name, this._directory.find(name, Directory));
    }
    return this._keyDirectories.get(name);
  }

  public asset(baseDenom: string): Asset | undefined {
    //if (!baseDenom) return undefined;
    if (!this._baseDenomToAssetMap) this.loadBaseDenoms(); // Ensure it's initialized
    if (!this._baseDenomToAssetMap?.has(baseDenom)) return undefined; // Base denom doesn't exist
    if (this._baseDenomToAssetMap.get(baseDenom) === null) {
      this._baseDenomToAssetMap.set(baseDenom, new Asset(this._chainName, baseDenom)); // Lazy-load asset
    }
    return this._baseDenomToAssetMap.get(baseDenom) || undefined;
  }

  private loadBaseDenoms(): void {
    if (this._baseDenomToAssetMap !== null) return; // Already initialized
    const assetlistFile = this.file(ChainFileName.ASSETLIST);
    if (!assetlistFile?.contents?.assets) {
      this._baseDenomToAssetMap = new Map(); // No assets found, but still initialize the Map
      return;
    }
    const assetArray: { base: string }[] = assetlistFile.contents.assets || [];
    this._baseDenomToAssetMap = new Map(assetArray.map(asset => [asset.base, null]));
  }

  public version(versionName: string): Version | null | undefined {
    if (!this._versionNameToVersionMap) this.loadVersionNames(); // Ensure it's initialized
    if (!this._versionNameToVersionMap?.has(versionName)) return undefined; // Base denom doesn't exist
    if (this._versionNameToVersionMap.get(versionName) === null) {
      this._versionNameToVersionMap.set(versionName, new Version(this._chainName, versionName)); // Lazy-load asset
    }
    return this._versionNameToVersionMap.get(versionName);
  }

  private loadVersionNames(): void {
    if (this._versionNameToVersionMap !== null) return; // Already initialized
    const versionFile = this.file(ChainFileName.VERSIONS);
    if (!versionFile?.contents?.versions) {
      this._versionNameToVersionMap = new Map(); // No versions found, but still initialize the Map
      return;
    }
    const versionArray: { name: string }[] = versionFile.contents.versions || [];
    this._versionNameToVersionMap = new Map(versionArray.map(version => [version.name, null]));
  }

}

export default Chain;