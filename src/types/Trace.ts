import RegistryObject from './RegistryObject.js';
import NewPointer from './NewPointer.js';
import Asset from './Asset.js';
import Chain from './Chain.js';
//import ChainRegistry from './ChainRegistry.js';

class Trace extends RegistryObject {

  public static readonly Type = {
    IBC: "ibc",
    IBC_CW20: "ibc-cw20",
    IBC_BRIDGE: "ibc-bridge",
    BRIDGE: "bridge",
    WRAPPED: "wrapped",
    LIQUID_STAKE: "liquid-stake",
    SYNTHETIC: "synthetic",
    ADDITIONAL_MINTAGE: "additional-mintage",
    TEST_MINTAGE: "test-mintage",
    LEGACY_MINTAGE: "legacy-mintage"
  } as const;

  public static readonly PropertyName = {
    TYPE: "type",
    COUNTERPARTY: "counterparty",
    CHAIN: "chain",
    PROVIDER: "provider"
  } as const;

  
  //public keyType: Number = 0;

  public constructor(
    parentPointer: NewPointer | null,
    key: number,
    json: Record<string, any>) {
    super(new NewPointer(parentPointer, key, "Trace"), json);
  }

/* public override get(
    objectType: string,
    key: RegistryObject["keyType"]
  ): RegistryObject | undefined {
    if (objectType === "Trace") {
      return this | undefined;
    }
    if (objectType === "Asset") {
      return this.assetPointer?.object as T;
    }

    return super.get(objectType, key) as T;
  }*/

  private _assetPointer: NewPointer | undefined | null = null;
  public get assetPointer(): NewPointer | undefined {
    if (this._assetPointer !== null) return this._assetPointer;
    const counterparty: Record<string, any> | undefined = this.property(Trace.PropertyName.COUNTERPARTY);
    const counterpartyChain: RegistryObject | undefined =
      (this._pointer?.root.object as RegistryObject)?.get("Chain", counterparty?.chain_name);
    if (!counterpartyChain) return this._assetPointer = undefined;
    const pointer = new NewPointer(
      counterpartyChain.pointer,
      counterparty?.base_denom,
      "Asset"
    );
    return this._assetPointer = pointer ?? undefined;
  }

}

export default Trace;