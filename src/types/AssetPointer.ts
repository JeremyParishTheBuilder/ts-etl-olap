export class AssetPointer {

  protected _chainName: string;
  protected _baseDenom: string;
  private _key: string; //as {chain_name:base_denom}; e.g., "osmosis:uosmo"

  public constructor(chainName: string, baseDenom: string) {
    this._chainName = chainName;
    this._baseDenom = baseDenom;
    this._key = chainName + ":" + baseDenom;
  }

  public get key(): string {
    return this._key;
  }

}

export default AssetPointer;