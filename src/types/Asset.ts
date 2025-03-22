import AssetPointer from './AssetPointer.js';
import ChainPointer from './ChainPointer.js';
import RegistryObject from './RegistryObject.js';
import Trace from './Trace.js';
import ChainRegistry from './ChainRegistry.js';
import Chain from './Chain.js';

class Asset extends RegistryObject {

  /*private _assetPointer: AssetPointer;
  public get assetPointer(): AssetPointer {
    return this._assetPointer;
  }*/

  public get pointer(): AssetPointer { return super.pointer as AssetPointer }

  public constructor(parent: ChainPointer, baseDenom: string, json: Record<string, any> | null = null) {
    super(new AssetPointer(parent, baseDenom), json);
    //this._assetPointer = new AssetPointer(chainName, baseDenom);
  }

  //Do we need Chain?
  public get chain(): Chain {
    return ChainRegistry.getInstance().chain(this.parent.key)!;
  }

  //Do we really need key?
  /*public key(): string {
    return this._assetPointer.key();
  }*/

  public static readonly PropertyName = {
    TRACES: "traces"
  }

  public property(propertyName: string, traceTypes: Array<string> = Object.values(Trace.Type)): any | undefined {

    //bypass cache when looking for traces
    if (propertyName === Asset.PropertyName.TRACES && traceTypes.length) return this.traces(traceTypes);

    const VALUE = super.property(propertyName);
    if (VALUE) return VALUE;

    if (!traceTypes.length) return undefined; // Stop if not to inherit, such as when traceTypes = []
    if (!traceTypes.includes(this.lastTrace?.property(Trace.PropertyName.TYPE)!)) return undefined; // Stop inheriting if wrong trace type

    // inherit from traces (recursion)
    return ChainRegistry.getInstance()
      .asset(this.lastTrace?.assetPointer!)
      ?.property(propertyName, traceTypes);
  }

  protected fetchJsonProperties(): Record<string, any> | null {
    return ChainRegistry.getInstance()
      .chain(this.pointer!.parent!.key)
      ?.file(Chain.FileName.ASSETLIST)
      ?.contents?.assets?.find(
        (asset: any) => asset.base === this.pointer!.key
      ) || {};
  }

  //--Traces--
  private _lastTrace: Trace | undefined | null = null;

  public get lastTrace(): Trace | undefined {
    if (this._lastTrace !== null) return this._lastTrace;  // Use cached value
    const traces = this.property(Asset.PropertyName.TRACES, []); //get Json traces--will NOT bypass json loading
    return this._lastTrace = traces?.length ? new Trace(traces[traces.length - 1]) : undefined; //save the very last
  }

  private traces(traceTypes: Array<string> = Object.values(Trace.PropertyName)): Array<Trace> | undefined {
    const traceType = this.lastTrace?.property<string>(Trace.PropertyName.TYPE);

    if (!traceType || !traceTypes.includes(traceType)) return undefined;

    const previousTraces = ChainRegistry.getInstance()
      .asset(this._lastTrace!.assetPointer)
      ?.property(Asset.PropertyName.TRACES, traceTypes);

    return previousTraces ? [...previousTraces, this._lastTrace!] : [this._lastTrace!];
  }
  //--

  //--Derived Properties--
  public static readonly DerivedPropertyName = {
    DECIMALS: "decimals"
  }
  public get DerivedPropertyName() {
    return Asset.DerivedPropertyName
  }

  public derivedProperty(propertyName: string): any | undefined {
    if (!this._derivedProperties) return undefined;

    if (propertyName === this.DerivedPropertyName.DECIMALS) {
      return this._derivedProperties[propertyName] = this.decimals;
    }

    //Add checks for additional derived properties here...

  }

  private get decimals(): number | undefined {
    const display = this.property("display");
    const denom_units = this.property("denom_units");
    if (!display || !denom_units) return undefined;

    for (let i = denom_units.length - 1; i >= 0; --i) {
      if (denom_units[i].denom === display) {
        return denom_units[i].exponent;
      }
    }

    return undefined;
  }
  //--

}

export default Asset;