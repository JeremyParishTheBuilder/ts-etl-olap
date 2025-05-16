import RegistryObject from "./RegistryObject.js";
import NewPointer from './NewPointer.js';

class IbcChannelParty extends RegistryObject {

  public static readonly PropertyName = {
    PORT_ID: "port_id",
    CHANNEL_ID: "channel_id"
  }

  public keyType: number = -1;
  public directoryObjectType: null = null;
  constructor(
    parentPointer: NewPointer<RegistryObject> | null,
    key: IbcChannelParty["keyType"],
    json: Record<string, any> | null = null
  ) {
    super(new NewPointer(IbcChannelParty, parentPointer, key), json);
  }
}

export default IbcChannelParty;