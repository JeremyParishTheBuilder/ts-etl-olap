import RegistryObject from './RegistryObject.js';
import AssetPointer from './AssetPointer.js';
import ChainPointer from './ChainPointer.js';

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

  private _assetPointer: AssetPointer | undefined | null = null;

  public constructor(json: Record<string, any>) {
    super(undefined, json);
  }

  public get assetPointer(): AssetPointer | undefined {
    if (this._assetPointer !== null) return this._assetPointer;
    const counterparty: Record<string, any> | undefined = this.property(Trace.PropertyName.COUNTERPARTY);
    return this._assetPointer = counterparty
      ? new AssetPointer(
          new ChainPointer(undefined, counterparty.chain_name),
          counterparty.base_denom
        )
      : undefined;
  }

}

export default Trace;