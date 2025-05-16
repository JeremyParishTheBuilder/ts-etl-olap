import ChainRegistry from './ChainRegistry.js';
import RegistryObject from './RegistryObject.js';
import NewPointer from './NewPointer.js';
import Chain from './Chain.js';

class Version extends RegistryObject {


  public keyType: string = "";


  public constructor(
    parentPointer: NewPointer<RegistryObject> | null,
    key: Version["keyType"],
    json: Record<string, any> | null = null
  ) {
    super(new NewPointer(Version, parentPointer, key), json);
  }


}

export default Version;