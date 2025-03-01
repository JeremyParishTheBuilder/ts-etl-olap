import Directory from './Directory.js';
import File from './File.js';
import { JsonFileName } from './ChainRegistry.js';
import Asset from './Asset.js'; 
//import Version from '.Version.js';

export class Chain {

  private _directory: Directory;
  private _chainName: string;

  private _properties: Record<string, any> | null | undefined = null; // Stores JSON properties

  private _assetlistFile: File | null | undefined = null;
  private _baseDenoms: Set<string> | null | undefined = null;
  private _assetsMap: Map<string, Asset> | null = null;

  private _versionsFile: File | null | undefined = null;


  //private versions: (Version)[] | null = null;

  private _imagesDirectory: Directory | null = null;

  [key: string]: any;

  public constructor(directory: Directory) {
    this._directory = directory;
    this._chainName = directory?.basename;

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
    const chainFile = this._directory.contents.find(
      (file) => file instanceof File && file.basename === JsonFileName.CHAIN
    ) as File | undefined;
    this._properties = chainFile ? (chainFile.contents || {}) : undefined;
  }

  public get chainName(): string {
    return this._chainName; //by directory name, not JSON property--some chains don't have chain json
  }

  public get directory(): Directory {
    return this._directory;
  }

  public get assetlistFile(): File | null | undefined {
    return this._assetlistFile;
  }

  public get base_denoms(): Set<string> | undefined {
    if (this._baseDenoms === null) this.loadBaseDenoms();
    return this._baseDenoms!;
  }

  public asset(baseDenom: string): Asset | undefined {
    if (this._baseDenoms === null) this.loadBaseDenoms();
    if (!this._baseDenoms) return undefined; // No assetlist.json was found
    if (!this._baseDenoms!.has(baseDenom)) return undefined; // Base denom doesn't exist
    if (!this._assetsMap!.has(baseDenom)) {
      this._assetsMap!.set(baseDenom, new Asset(this, baseDenom));
    }
    return this._assetsMap!.get(baseDenom);
  }

  private loadBaseDenoms(): void {
    if (this._baseDenoms !== null) return;
    this._assetlistFile = this._directory.contents.find(
      (file) => file instanceof File && file.basename === JsonFileName.ASSETLIST
    ) as File | undefined;
    if (!this._assetlistFile?.contents?.assets) {
      this._baseDenoms = undefined; // Mark as "tried but no assets"
      return;
    }
    const assetArray: { base: string }[] = this._assetlistFile.contents.assets || [];
    this._baseDenoms = new Set(assetArray.map(asset => asset.base));
    this._assetsMap = new Map();
  }

}

export default Chain;