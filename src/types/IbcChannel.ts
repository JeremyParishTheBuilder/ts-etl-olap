import RegistryObject from "./RegistryObject.js";

class IbcChannel extends RegistryObject {

  public static TAGS: string = "tags";
  public static CHAIN_1: string = "chain_1";
  public static CHAIN_2: string = "chain_2";
  public static PORT_ID: string = "port_id";

  constructor(json: Record<string, any>) {
    super(json);
  }

}

export default IbcChannel;