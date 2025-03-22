import Pointer from './Pointer.js';
import ChainRegistryPointer from './ChainRegistryPointer.js';
import Chain from './Chain.js';

class ChainPointer extends Pointer {

  constructor(
    parent: ChainRegistryPointer = new ChainRegistryPointer(),
    key: string
  ) {
    super(parent, key);
  }
  public get parent(): ChainRegistryPointer {
    return super.parent as ChainRegistryPointer;
  }
  public get object(): Chain | undefined {
    return this.parent.object.chain(this.key);
  }
}

export default ChainPointer;