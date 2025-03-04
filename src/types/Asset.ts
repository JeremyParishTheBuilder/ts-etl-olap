import AssetPointer from './AssetPointer.js'
import {
  AssetPropertyName,
  AssetDerivedPropertyName,
  allAssetDerivedPropertyNames
} from '../constants/AssetConstants.js'; 
import Chain from './Chain.js';
import Trace from './Trace.js';
import ChainRegistry from './ChainRegistry.js';
import { ChainFileName } from '../constants/ChainConstants.js';
import { TraceType, allTraceTypes } from '../constants/TraceConstants.js';

export class Asset extends AssetPointer {

  private _properties: Record<string, any> | null = null; // Stores JSON properties
  private _lastTrace: Trace | undefined | null = null;

  //TODO origin asset

  [key: string]: any;

  public constructor(chain: Chain, baseDenom: string) {
    super(chain.chainName, baseDenom);
  }

  private deriveDecimals(): void {
    const display = this.property("display");
    const denom_units = this.property("denom_units");
    for (let i = denom_units.length - 1; i >= 0; --i) {
      if (denom_units[i].denom === display) {
        this._properties![AssetDerivedPropertyName.DECIMALS] = denom_units[i].exponent;
        return;
      }
    }
  }

  public property(propertyName: string, traceTypes: Array<TraceType> = allTraceTypes): any | undefined {
    if (this._properties === null) this.loadProperties();
    if (this._properties![propertyName]) return this._properties![propertyName];
    if (allAssetDerivedPropertyNames.includes(propertyName as AssetDerivedPropertyName)) {
      if (propertyName === AssetDerivedPropertyName.DECIMALS) {
        this.deriveDecimals();
        return this._properties![propertyName];
      };
    }
    if (traceTypes.length === 0) return undefined; //then don't trace back to find a value
    if (!traceTypes.includes(this.lastTrace?.type!)) return undefined; //last trace must match type
    /*if (propertyName === AssetPropertyName.TRACES) { //build a custom traces array
      const fullTraces = this.fullTraces();
      let customTraces = [];
      for (let i = fullTraces!.length - 1; i >= 0; --i) {
        if (traceTypes.includes(fullTraces![i].type)) {
          customTraces.push(fullTraces![i]);
        } else {
          return customTraces?.length > 0 ? customTraces : undefined;
        }
      }
    }*/
    if (propertyName === AssetPropertyName.TRACES) return this.traces(traceTypes);
    return ChainRegistry.getInstance().
      asset(this.lastTrace?.assetPointer!)?.
      property(propertyName);
  }

  private loadProperties(): void {
    if (this._properties !== null) return;
    this._properties = ChainRegistry.getInstance().
      chain(this._chainName)?.
      file(ChainFileName.ASSETLIST)?.
      contents?.
      assets?.
      find(
        (asset: any) =>
          asset.base === this._baseDenom
      ) ?? {};
  }

  public get lastTrace(): Trace | undefined {
    if (this._lastTrace !== null) return this._lastTrace;  // Use cached value
    const traces = this.property(AssetPropertyName.TRACES, []); //get Json traces
    this._lastTrace = traces?.length ? new Trace(traces[traces.length - 1]) : undefined; //save the very last
    return this._lastTrace;
  }

  private traces(traceTypes: TraceType[] = allTraceTypes): Array<Trace> | undefined {
    if (!traceTypes.includes(this.lastTrace!?.type)) return undefined;
    const previousTraces = ChainRegistry.getInstance().
      asset(this._lastTrace!.assetPointer)?.
      properties(AssetPropertyName.TRACES, traceTypes);
    if (!previousTraces) return [this._lastTrace!];
    return [...previousTraces, this._lastTrace!];
  }

}

export default Asset;