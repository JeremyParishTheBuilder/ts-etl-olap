import RegistryObject from "./RegistryObject.js";
import IbcConnection from './IbcConnection.js';
import IbcConnectionPointer from './IbcConnectionPointer.js';
import IbcChannelPointer from './IbcChannelPointer.js';

class IbcChannel extends RegistryObject {

  public get pointer(): IbcChannelPointer { return this._pointer as IbcChannelPointer; }

  public static TAGS: string = "tags";
  public static CHAIN_1: string = "chain_1";
  public static CHAIN_2: string = "chain_2";
  public static PORT_ID: string = "port_id";
  public static CHANNEL_ID: string = "channel_id";

  constructor(parent: IbcConnectionPointer, key: number, json: Record<string, any>) {
    super(new IbcChannelPointer(parent, key), json);
  }

  //--JSON Properties--
  public static readonly PropertyName = {
    CHAIN_1: "chain_1",
    CHAIN_2: "chain_2",
    PORT_ID: "port_id",
    CHANNEL_ID: "channel_id",
    TAGS: "tags"
  } as const;
  //--

  //--Derived Properties--

  //--

}

export default IbcChannel;