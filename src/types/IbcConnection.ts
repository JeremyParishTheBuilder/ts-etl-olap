import RegistryObject from './RegistryObject.js';
import IbcChannel from './IbcChannel.js';
import { IbcConnectionPropertyName } from '../constants/IbcConnectionConstants.js';
import ChainRegistry from './ChainRegistry.js';
import Chain from './Chain.js';

class IbcConnection extends RegistryObject {

  private _chain1: string | undefined;
  private _chain2: string | undefined;
  private _channels: IbcChannel[] | undefined = []; 

  constructor(json: Record<string, any>) {
    super(json);
    this._chain1 = json.chain_1.chain_name;
    this._chain2 = json.chain_2.chain_name;
    this.property(IbcConnectionPropertyName.CHANNELS)?.forEach((channel: Record<string, any>) => {
      this._channels!.push(new IbcChannel(channel));
    });
    if (!this._channels!.length) this._channels = undefined;
  }

  
  //protected fetchJsonProperties(): Record<string, any> | null {
    //return ChainRegistry.getInstance().
      //ibcConnection(this._chain1, this._chain2);
  //}
  
  /*
  public get chain1(): string | undefined {
    if (this._chain1) return this._chain1;
    return this._chain1 = property(this._chain1);
  }*/

  public channel(
    chain_1: Record<string, any> = { "port_id": "transfer" },
    chain_2: Record<string, any> = { "port_id": "transfer" },
    status: string = "live"
  ): IbcChannel | undefined {
    if (!this._channels) return undefined;

    const matches = this._channels.filter((channel: IbcChannel) => {
      const c1 = channel.property("chain_1");
      const c2 = channel.property("chain_2");
      const tags = channel.property("tags");

      return (
        (!chain_1.channel_id || c1?.channel_id === chain_1.channel_id) &&
        (!chain_1.port_id || c1?.port_id === chain_1.port_id) &&
        (!chain_2.channel_id || c2?.channel_id === chain_2.channel_id) &&
        (!chain_2.port_id || c2?.port_id === chain_2.port_id) &&
        (!status || tags?.status === status)
      );
    });

    return matches.length === 1 ? matches[0] : undefined;
  }

}

/*
export function findIbcConnection(): IbcConnection | undefined {
  return ChainRegistry.getInstance().
    ibcConnection()
}*/

export default IbcConnection;