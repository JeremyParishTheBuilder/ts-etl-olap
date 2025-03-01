import AssetPointer from './AssetPointer.js'
import Chain from './Chain.js';

export class Asset extends AssetPointer {

  private _chain: Chain;
  private _properties: Record<string, any> | null = null; // Stores JSON properties

  [key: string]: any;

  public constructor(chain: Chain, baseDenom: string) {
    super(chain.chainName, baseDenom);
    this._chain = chain;

    return new Proxy(this, {
      get: (target, prop: string) => {
        if (prop in target) return (target as any)[prop];
        if (target._properties === null) {
          target.loadProperties();
        }
        return target._properties?.[prop] ?? undefined;
      },
    });
  }

  private loadProperties(): void {
    if (this._properties !== null) return;
    const assetlistFile = this._chain.assetlistFile;
    if (!assetlistFile?.contents?.assets) {
      this._properties = {}; // Mark as "tried but no properties"
      return;
    }
    this._properties = assetlistFile.contents.assets.find(
      (asset: any) => asset.base === this._baseDenom
    ) ?? {};
  }

}

export default Asset;