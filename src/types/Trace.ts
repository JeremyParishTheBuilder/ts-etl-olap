import AssetPointer from './AssetPointer.js';
import RegistryObject from './RegistryObject.js';
import { TracePropertyName } from '../constants/TraceConstants.js';

class Trace extends RegistryObject {

  private _assetPointer: AssetPointer | undefined | null = null;

  public constructor(json: Record<string, any>) {
    super(json);
  }

  public get assetPointer(): AssetPointer | undefined {
    if (this._assetPointer !== null) return this._assetPointer;
    const counterparty: Record<string, any> | undefined = this.property(TracePropertyName.COUNTERPARTY);
    return this._assetPointer = counterparty
      ? new AssetPointer(counterparty.chain_name, counterparty.base_denom)
      : undefined;
  }

}

export default Trace;