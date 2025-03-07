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
    if (!counterparty) return this._assetPointer = undefined;
    return this._assetPointer = new AssetPointer(counterparty.chain_name, counterparty.base_denom);
  }

}

export default Trace;