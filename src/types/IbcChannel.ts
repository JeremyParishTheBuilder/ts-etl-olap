import RegistryObject from "./RegistryObject.js";
import NewPointer from './NewPointer.js';
//import IbcChannelParty from './IbcChannelParty.js';

/*export type IbcChannelKey = number;

class IbcChannel extends RegistryObject {

  public keyType: number = -1;
  //public directoryObjectType: null = null;

  constructor(
    parentPointer: NewPointer | null,
    key: IbcChannel["keyType"],
    json: Record<string, any> | null = null
  ) {
    super(new NewPointer(parentPointer, key, "IbcChannel"), json);
  }

  //--JSON Properties--
  public static readonly PropertyName = {
    CHAIN_1: "chain_1",
    CHAIN_2: "chain_2",
    TAGS: "tags"
  } as const;
  //--

  //--Derived Properties--

  //--

  protected fetchJsonProperties(): Record<string, any> | null {
    return this._jsonProperties || {"test": "hi"};
  }

  //TODO, replace with get()
  public ibcChannelParty(ibcChannelPartyKey: IbcChannelParty["keyType"]): IbcChannelParty | undefined {
    if (ibcChannelPartyKey === 1) { return this.property(IbcChannel.PropertyName.CHAIN_1) }
    else if (ibcChannelPartyKey === 2) { return this.property(IbcChannel.PropertyName.CHAIN_2) }
    else { return undefined; }
  }

}

export default IbcChannel;*/