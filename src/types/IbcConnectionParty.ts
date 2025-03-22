import RegistryObject from './RegistryObject.js';
import IbcConnection from './IbcConnection.js';
import IbcConnectionPointer from './IbcConnectionPointer.js';
import IbcConnectionPartyPointer from './IbcConnectionPartyPointer.js';

class IbcConnectionParty extends RegistryObject {

  public get pointer(): IbcConnectionPartyPointer { return this.pointer as IbcConnectionPartyPointer; }

  constructor(parent: IbcConnectionPointer, key: string, json: Record<string, any>) {
    super(new IbcConnectionPartyPointer(parent, key), json);
  }

  //--Properties--
  public static readonly PropertyName = {
    CHAIN_NAME: "chain_name",
    CLIENT_ID: "client_id",
    CONNECTION_ID: "connection_id"
  }
  //--

  //--Derived Properties--
  public static readonly DerivedPropertyName = {
    COUNTERPARTY: "counterparty"
  }
  public get DerivedPropertyName() {
    return IbcConnectionParty.DerivedPropertyName;
  }

  public derivedProperty(
    propertyName: string
  ): any | undefined {
    if (!this._derivedProperties) return undefined;

    if (propertyName === this.DerivedPropertyName.COUNTERPARTY) {
      return this._derivedProperties[propertyName] = this.counterparty;
    }

    //Add checks for additional derived properties here...

  }

  private counterparty(): IbcConnectionPartyPointer {
    const counterpartyKey = this.pointer.key === IbcConnection.PropertyName.CHAIN_1
      ? IbcConnection.PropertyName.CHAIN_2
      : IbcConnection.PropertyName.CHAIN_1
    return new IbcConnectionPartyPointer(this.pointer.parent as IbcConnectionPointer, counterpartyKey);
  }
  //--

}

export default IbcConnectionParty;