import Pointer from './Pointer.js';
import Asset from './Asset.js';
import ChainPointer from './ChainPointer.js';
import ChainRegistryPointer from './ChainRegistryPointer.js';

class AssetPointer extends Pointer {

  constructor(parent: Pointer, key: string, key2?: string);
  constructor(
    parent: ChainPointer,
    key: string,
    key2?: string
  ) {
    if (key2) {
      let crp = new ChainRegistryPointer();
      super(new ChainPointer(crp, key), key2);
    }
    super(parent, key);
  }
  public get parent(): ChainPointer {
    return super.parent as ChainPointer;
  }
  public get object(): Asset | undefined {
    return this.parent.object?.asset(this.key);
  }
}

export default AssetPointer;