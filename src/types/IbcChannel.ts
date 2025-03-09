import RegistryObject from "./RegistryObject.js";

class IbcChannel extends RegistryObject {

  constructor(json: Record<string, any>) {
    super(json);
  }

}

export default IbcChannel;