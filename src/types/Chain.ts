import ChainDirectory from './ChainDirectory.js';
import { ChainFileName, ChainDirName } from '../constants/ChainConstants.js';
import Asset from './Asset.js'; 
import Version from './Version.js';

export class Chain {

  private _chainName: string;
  private _chainDirectory: ChainDirectory;
  private _properties: Record<string, any> | null | undefined = null; // Stores JSON properties

  private _baseDenomToAssetMap: Map<string, Asset | null | undefined> | null = null;
  private _versionNameToVersionMap: Map<string, Version | null | undefined> | null = null;

  [key: string]: any;

  public constructor(directory: ChainDirectory) {
    this._chainDirectory = directory;
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
    const chainFile = this._chainDirectory.file(ChainFileName.CHAIN);
    this._properties = chainFile ? (chainFile.contents || {}) : undefined;
  }

  public get chainName(): string {
    return this._chainName; //by directory name, not JSON property--some chains don't have chain json
  }

  public get chainDirectory(): ChainDirectory {
    return this._chainDirectory;
  }

  /*
  // Delegate file method to ChainDirectory
  public file(name: ChainFileName): File | undefined {
    return this._chainDirectory.file(name);
  }

  // Delegate directory method to ChainDirectory
  public directory(name: ChainDirName): Directory | undefined {
    return this._chainDirectory.directory(name);
  }
  */

  public asset(baseDenom: string): Asset | null | undefined {
    if (!this._baseDenomToAssetMap) this.loadBaseDenoms(); // Ensure it's initialized
    if (!this._baseDenomToAssetMap?.has(baseDenom)) return undefined; // Base denom doesn't exist
    if (this._baseDenomToAssetMap.get(baseDenom) === null) {
      this._baseDenomToAssetMap.set(baseDenom, new Asset(this, baseDenom)); // Lazy-load asset
    }
    return this._baseDenomToAssetMap!.get(baseDenom);
  }

  private loadBaseDenoms(): void {
    if (this._baseDenomToAssetMap !== null) return; // Already initialized
    const assetlistFile = this._chainDirectory.file(ChainFileName.ASSETLIST);
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
      this._versionNameToVersionMap.set(versionName, new Version(this, versionName)); // Lazy-load asset
    }
    return this._versionNameToVersionMap!.get(versionName);
  }

  private loadVersionNames(): void {
    if (this._versionNameToVersionMap !== null) return; // Already initialized
    const versionFile = this._chainDirectory.file(ChainFileName.VERSIONS);
    if (!versionFile?.contents?.versions) {
      this._versionNameToVersionMap = new Map(); // No versions found, but still initialize the Map
      return;
    }
    const versionArray: { name: string }[] = versionFile.contents.versions || [];
    this._versionNameToVersionMap = new Map(versionArray.map(version => [version.name, null]));
  }

}

export default Chain;