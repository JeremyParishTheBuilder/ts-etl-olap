import AssetPointer from '../types/AssetPointer.js';
import { TraceType, nonIbcTransition } from '../constants/TraceConstants.js';

class Trace {

  private _type: TraceType;
  private _counterparty: {
    chain_name: string;
    base_denom?: string;
    channel_id?: string;
    port?: string;
    contract?: string;
  };
  private _chain?: {
    channel_id?: string;
    port?: string;
    path?: string;
    contract?: string;
  };
  private _provider?: string;
  private _assetPointer: AssetPointer;

  public constructor(trace: {
    type: TraceType;
    counterparty: { chain_name: string; base_denom: string; channel_id?: string; port?: string; contract?: string };
    chain?: { channel_id?: string; port?: string; path?: string; contract?: string };
    provider?: string;
  }) {
    this._type = trace.type;
    this._counterparty = trace.counterparty;
    this._chain = trace.chain;
    this._provider = trace.provider;
    this._assetPointer = new AssetPointer(trace.counterparty.chain_name, trace.counterparty.base_denom);

    this.validate();

  }

  private validate(): void {
    if (!this._counterparty.chain_name) throw new Error(`${this._type} trace must have a Counterparty chain_name`);
    if (!this._counterparty.base_denom) throw new Error(`${this._type} trace must have a Counterparty base_denom`);

    if (this._type === TraceType.IBC || this._type === TraceType.IBC_CW20) {
      if (!this._chain) throw new Error(`${this._type} trace must have a chain`);
      if (!this._counterparty.channel_id) throw new Error(`${this._type} trace must have a channel_id`);
    }

    if (this._type === TraceType.IBC_CW20 && !this._counterparty.port) {
      throw new Error(`${this._type} trace must have a port`);
    }

    if (this._type === TraceType.IBC_BRIDGE) {
      if (!this._chain) throw new Error(`IBC_BRIDGE trace must have a chain`);
      if (!this._provider) throw new Error(`IBC_BRIDGE trace must have a provider`);
    }

    if (nonIbcTransition.includes(this._type) && !this._provider) {
      throw new Error(`NON_IBC trace must have a provider`);
    }
  }

  public get type(): TraceType {
    return this._type;
  }

  public get counterparty() {
    return this._counterparty;
  }

  public get chain() {
    return this._chain;
  }

  public get provider(): string | undefined {
    return this._provider;
  }

  public get assetPointer(): AssetPointer {
    return this._assetPointer;
  }

}

export default Trace;