import AssetPointer from './AssetPointer.js';
import RegistryObject from './RegistryObject.js';
import {
  AssetPropertyName,
  AssetDerivedPropertyName,
  allAssetDerivedPropertyNames
} from '../constants/AssetConstants.js'; 
import Trace from './Trace.js';
import ChainRegistry from './ChainRegistry.js';
import { ChainFileName } from '../constants/ChainConstants.js';
import { TraceType, allTraceTypes, TracePropertyName } from '../constants/TraceConstants.js';

export class Asset extends RegistryObject {

  private _assetPointer: AssetPointer;
  private _lastTrace: Trace | undefined | null = null;
  private _derivedProperties: Record<string, any> | null = null;

  public constructor(chainName: string, baseDenom: string, json: Record<string, any> | null = null) {
    super(json);
    this._assetPointer = new AssetPointer(chainName, baseDenom);
  }

  public get assetPointer(): AssetPointer {
    return this._assetPointer;
  }

  private deriveDecimals(): number | undefined {
    const display = this.property("display");
    const denom_units = this.property("denom_units");
    for (let i = denom_units.length - 1; i >= 0; --i) {
      if (denom_units[i].denom === display) {
        return denom_units[i].exponent;
      }
    }
    return undefined;
  }

  public property(propertyName: string, traceTypes: Array<TraceType> = allTraceTypes): any | undefined {

    //bypass cache when looking for traces
    if (propertyName === AssetPropertyName.TRACES && traceTypes.length) return this.traces(traceTypes);

    //cached json properties
    if (this._jsonProperties === null) this.loadProperties();
    if (!this._jsonProperties) return undefined;
    if (this._jsonProperties[propertyName]) return this._jsonProperties[propertyName];

    //cached derived properties
    if (allAssetDerivedPropertyNames.includes(propertyName as AssetDerivedPropertyName)) {
      if (this._derivedProperties === null) this._derivedProperties = {};
      if (this._derivedProperties[propertyName]) return this._derivedProperties[propertyName];
      if (propertyName === AssetDerivedPropertyName.DECIMALS)
        if (!(propertyName in this._derivedProperties)) this._derivedProperties[propertyName] = null;
        return this._derivedProperties[propertyName] = this.deriveDecimals();
    }

    if (!traceTypes.length) return undefined; // Stop if not to inherit
    if (!traceTypes.includes(this.lastTrace?.property("type")!)) return undefined; // Stop inheriting if wrong trace type

    // inherit from traces (recursion)
    return ChainRegistry.getInstance()
      .asset(this.lastTrace?.assetPointer!)
      ?.property(propertyName, traceTypes);
  }

  protected fetchJsonProperties(): Record<string, any> | null {
    return ChainRegistry.getInstance()
      .chain(this._assetPointer.chainName!)
      ?.file(ChainFileName.ASSETLIST)
      ?.contents?.assets?.find(
        (asset: any) => asset.base === this._assetPointer.baseDenom
      ) || {};
  }

  public get lastTrace(): Trace | undefined {
    if (this._lastTrace !== null) return this._lastTrace;  // Use cached value
    const traces = this.property(AssetPropertyName.TRACES, []); //get Json traces--will NOT bypass json loading
    return this._lastTrace = traces?.length ? new Trace(traces[traces.length - 1]) : undefined; //save the very last
  }

  private traces(traceTypes: Array<TraceType> = allTraceTypes): Array<Trace> | undefined {
    const traceType = this.lastTrace?.property<TraceType>(TracePropertyName.TYPE);

    if (!traceType || !traceTypes.includes(traceType)) return undefined;

    const previousTraces = ChainRegistry.getInstance()
      .asset(this._lastTrace!.assetPointer)
      ?.property(AssetPropertyName.TRACES, traceTypes);

    return previousTraces ? [...previousTraces, this._lastTrace!] : [this._lastTrace!];
  }

}

export default Asset;