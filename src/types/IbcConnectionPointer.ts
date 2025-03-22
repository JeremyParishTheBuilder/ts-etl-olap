import Pointer from './Pointer.js';
import IbcConnection from './IbcConnection.js';
import ChainRegistryPointer from './ChainRegistryPointer.js';

class IbcConnectionPointer extends Pointer {
  constructor(
    parent: ChainRegistryPointer,
    key: string
  ) { super(parent, key); }
  public get parent(): ChainRegistryPointer {
    return super.parent as ChainRegistryPointer;
  }
  public get object(): IbcConnection | undefined {
    return this.parent.object.ibcConnection(this.key);
  }
}

export default IbcConnectionPointer;