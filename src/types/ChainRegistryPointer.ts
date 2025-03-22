import Pointer from './Pointer.js';
import ChainRegistry from './ChainRegistry.js';

class ChainRegistryPointer extends Pointer {
  constructor() {
    super(undefined, undefined);
  }
  public get parent(): ChainRegistryPointer {
    return super.parent as ChainRegistryPointer;
  }
  public get object(): ChainRegistry {
    return ChainRegistry.getInstance();
  }
}

export default ChainRegistryPointer;