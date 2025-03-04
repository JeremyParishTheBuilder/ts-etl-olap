import AssetPointer from './AssetPointer.js'
import { AssetDerivedPropertyName } from '../constants/AssetConstants.js'; 
import Chain from './Chain.js';
import Trace from './Trace.js';
import ChainRegistry from './ChainRegistry.js';
import { ChainFileName } from '../constants/ChainConstants.js';
import { TraceType, allTraceTypes } from '../constants/TraceConstants.js';

export class Asset extends AssetPointer {

  private _chain: Chain;
  private _properties: Record<string, any> | null = null; // Stores JSON properties
  private _lastTrace: Trace | undefined | null = null;

  //TODO origin asset

  [key: string]: any;

  public constructor(chain: Chain, baseDenom: string) {
    super(chain.chainName, baseDenom);
    this._chain = chain;
  }

  private deriveDecimals(): void {
    const display = this.property("display");
    const denom_units = this.property("denom_units");
    for (let i = denom_units.length - 1; i = 0; --i) {
      if (denom_units[i].denom === display) {
        this._properties![AssetDerivedPropertyName.DECIMALS] = denom_units[i].exponent;
        return;
      }
    }
  }

  public property(propertyName: string, traceTypes: Array<TraceType> = allTraceTypes): any | undefined {
    if (this._properties === null) this.loadProperties();
    if (this._properties![propertyName] !== null) return this._properties![propertyName];
    if (this._derivedPropertyNames.includes(propertyName)) {
      if (propertyName === AssetDerivedPropertyName.DECIMALS) this.deriveDecimals();
      return this._properties![propertyName]!;
    }
    if (!traceTypes.includes(this.lastTrace?.type!)) return undefined;
    return ChainRegistry.getInstance().
      asset(this.lastTrace?.assetPointer!)?.
      property(propertyName);
  }

  private loadProperties(): void {
    if (this._properties !== null) return;
    const assetlistFile = this._chain.file(ChainFileName.ASSETLIST);
    if (!assetlistFile?.contents?.assets) {
      this._properties = {};
      return;
    }
    this._properties = assetlistFile.contents.assets.find(
      (asset: any) => asset.base === this._baseDenom
    ) ?? {};
  }

  public get lastTrace(): Trace | undefined {
    if (this._lastTrace !== null) return this._lastTrace;
    const traces = this.property("traces");
    this._lastTrace = traces?.length > 0 ? new Trace(traces[traces.length - 1]) : undefined;
    return this._lastTrace;
  }

  public get traces(): Array<Trace> | undefined {
    if (!this.lastTrace) return undefined;
    const previousTraces = ChainRegistry.getInstance().
      asset(this.lastTrace.assetPointer)?.
      traces;
    if (!previousTraces) return [this.lastTrace];
    previousTraces.push(this.lastTrace);
    return previousTraces;
  }

}

export default Asset;