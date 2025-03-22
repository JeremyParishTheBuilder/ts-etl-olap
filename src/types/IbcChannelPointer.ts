import Pointer from './Pointer.js'
import IbcConnectionPointer from './IbcConnectionPointer.js';

class IbcChannelPointer extends Pointer {
  constructor(
    parent: IbcConnectionPointer,
    key: number
  ) { super(parent, key); }
  public get parent(): IbcConnectionPointer | undefined {
    return super.parent as IbcConnectionPointer;
  }
}

export default IbcChannelPointer;