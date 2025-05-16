import RegistryObject from './RegistryObject.js';
import NewPointer from './NewPointer.js';
import Asset from './Asset.js';
import Chain from './Chain.js';
import ChainRegistry from './ChainRegistry.js';

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

  
  public keyType: Number = 0;

  public constructor(
    parentPointer: NewPointer<RegistryObject> | null,
    key: Trace["keyType"],
    json: Record<string, any>) {
    super(new NewPointer(Trace, parentPointer, key), json);
  }

  public override get<T extends RegistryObject>(
    objectType: new (...args: any[]) => RegistryObject,
    key: RegistryObject["keyType"]
  ): T | undefined {
    if (objectType === Trace) {
      return this as unknown as T | undefined;
    }
    if (objectType === Asset) {
      return this.assetPointer?.object as T;
    }

    return super.get(objectType, key) as T;
  }

  private _assetPointer: NewPointer<Asset> | undefined | null = null;
  public get assetPointer(): NewPointer<Asset> | undefined {
    if (this._assetPointer !== null) return this._assetPointer;
    const counterparty: Record<string, any> | undefined = this.property(Trace.PropertyName.COUNTERPARTY);
    const pointer = new NewPointer(
      Asset,
      this._pointer?.parent.parent.parent.object?.get(Chain, counterparty?.chain_name)?.pointer!,
      counterparty?.base_denom
    );
    return this._assetPointer = counterparty
      ? pointer
      : undefined;
  }

}

export default Trace;