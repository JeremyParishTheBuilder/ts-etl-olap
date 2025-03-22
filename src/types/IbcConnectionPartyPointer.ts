import Pointer from './Pointer.js'
import IbcConnectionPointer from './IbcConnectionPointer.js';

class IbcConnectionPartyPointer extends Pointer {
  constructor(
    parent: IbcConnectionPointer,
    key: string
  ) { super(parent, key); }
  public get parent(): IbcConnectionPointer | undefined {
    return super.parent as IbcConnectionPointer;
  }
}

export default IbcConnectionPartyPointer;