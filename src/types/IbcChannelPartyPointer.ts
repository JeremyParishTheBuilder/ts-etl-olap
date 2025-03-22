import Pointer from './Pointer.js'
import IbcChannelPointer from './IbcChannelPointer.js';

class IbcChannelPartyPointer extends Pointer {
  constructor(
    parent: IbcChannelPointer,
    key: string
  ) { super(parent, key); }
}

export default IbcChannelPartyPointer;