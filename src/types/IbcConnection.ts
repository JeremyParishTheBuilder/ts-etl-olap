import RegistryObject from './RegistryObject.js';

//import IbcConnectionPointer from './IbcConnectionPointer.js';

import File from './File.js';

import NewPointer from './NewPointer.js';

import IbcConnectionParty from './IbcConnectionParty.js';
//import IbcConnectionPartyPointer from './IbcConnectionPartyPointer.js';

import IbcChannel from './IbcChannel.js';
//import IbcChannelPointer from './IbcChannelPointer.js';

import ChainRegistry from './ChainRegistry.js';
//import ChainRegistryPointer from './ChainRegistryPointer.js';

export type IbcConnectionKeyType = string;

class IbcConnection extends RegistryObject {

  //public get pointer(): IbcConnectionPointer { return this._pointer as IbcConnectionPointer; }

  public static CHAIN_1: string = "chain_1";
  public static CHAIN_2: string = "chain_2";
  public static CHAIN_ANY: string = "chain_any";
  public static CHAIN_NAME: string = "chain_name";
  public static CLIENT_ID: string = "client_id";
  public static CONNECTION_ID: string = "connection_id";
  public static CHANNELS: string = "channels";

  public keyType: string = "";

  //I don't think party is the right term...
  public static IBC_CONNECTION_PARTY: string = "ibc_connection_party";

  private _file: File | undefined | null;

  /*public get pointer(): IbcConnectionPointer { return this._pointer; }
  public get key(): string { return this._key; }*/

  //private get file(): File | null { return this._file; }

  constructor(
    parentPointer: NewPointer<RegistryObject> | null,
    key: IbcConnection["keyType"],
    json: Record<string, any> | null = null,
    ibcFile: File | null = null
  ) {
    super(new NewPointer(IbcConnection, parentPointer, key), json);
    this._file = ibcFile;
  }

  //--Channels--
  private _channelArray: IbcChannel[] | undefined | null = null;

  private get channelArray(): IbcChannel[] {
    if (this._channelArray === null) this.loadChannels();
    return this._channelArray ?? [];
  }

  public partyIndicator(chainName: string): string | undefined {
    const [chainName1, chainName2] = this.pointer.key.split("-");
    if (chainName === chainName1) return IbcConnection.PropertyName.CHAIN_1;
    if (chainName === chainName2) return IbcConnection.PropertyName.CHAIN_2;
    return undefined;
  }

  public channel(channelKey: number = 0): IbcChannel | undefined {
    return this.channelArray[channelKey];
  }
  /*public channel(
    chain_1: Record<string, any> = { "port_id": "transfer" },
    chain_2: Record<string, any> = { "port_id": "transfer" },
    status: string = "live"
  ): IbcChannel | undefined {

    const matches = this.channelArray?.filter((channel: IbcChannel) => {
      const c1 = channel.property(IbcChannel.CHAIN_1);
      const c2 = channel.property(IbcChannel.CHAIN_2);
      const tags = channel.property(IbcChannel.TAGS);

      return (
        (!chain_1.channel_id || c1?.channel_id === chain_1.channel_id) &&
        (!chain_1.port_id || c1?.port_id === chain_1.port_id) &&
        (!chain_2.channel_id || c2?.channel_id === chain_2.channel_id) &&
        (!chain_2.port_id || c2?.port_id === chain_2.port_id) &&
        (!status || tags?.status === status)
      );
    });

    return matches?.length === 1 ? matches[0] : undefined;
  }*/

  public channels(conditions?: Array<(item: IbcChannel) => boolean>): IbcChannel[] {
    if (!this.channelArray) return [];
    return RegistryObject.objects<IbcChannel>(this.channelArray, conditions);
  }

  private loadChannels(): void {
    if (this._channelArray !== null) return;

    this._channelArray = [];

    const ibcFile = this.file;
    //if (!ibcFile?.contents?.[IbcConnection.PropertyName.CHANNELS]) return;

    //Uncomment the next 4 lines!!!
    /*const channels = ibcFile?.contents?.[IbcConnection.PropertyName.CHANNELS];
    for (let i = 0; i < channels?.length; ++i) {
      this._channelArray!.push(new IbcChannel(this.pointer, i, channels[i]));
    }*/

    /*ibcFile.contents[IbcConnection.PropertyName.CHANNELS].forEach((channel: Record<string, any>) => {
      this._channelArray!.push(new IbcChannel(this.pointer as IbcConnectionPointer, 0, channel)); //FIX THIS!!!
    });*/
  }
  //--

  //--Json Properties--
  public static readonly PropertyName = {
    CHAIN_1: "chain_1",
    CHAIN_2: "chain_2",
    CHANNELS: "channels"
  } as const;

  protected fetchJsonProperties(): Record<string, any> | null {
    return this.file()?.contents || {};
  }
  //--

  //--Key Files and Directories--
  /*public file(name?: string): File | undefined {
    if (this._file === null) {
      this._file = (this.pointer.parent.object as ChainRegistry)?.findIbcConnectionFile(this.pointer.key + ".json");
    }
    if (!this._file) return undefined;
    return this._file;
  }*/
  //--

  //--Derived Properties--
  public static readonly DerivedPropertyName = {
    IBC_CONNECTION_PARTIES: "ibc_connection_parties",
    IBC_CONNECTION_PARTY_1: "ibc_connection_party_1",
    IBC_CONNECTION_PARTY_2: "ibc_connection_party_2"
  }
  public get DerivedPropertyName() {
    return IbcConnection.DerivedPropertyName
  }

  public derivedProperty(
    propertyName: string
  ): any | undefined {
    if (!this._derivedProperties) return undefined;

    if (propertyName === this.DerivedPropertyName.IBC_CONNECTION_PARTY_1) {
      return this._derivedProperties[propertyName] = this.ibcConnectionParty(1);
    }
    if (propertyName === this.DerivedPropertyName.IBC_CONNECTION_PARTY_2) {
      return this._derivedProperties[propertyName] = this.ibcConnectionParty(2);
    }
    /*if (propertyName === this.DerivedPropertyName.IBC_CONNECTION_PARTIES) {
      return this._derivedProperties[propertyName] = this.ibcConnectionParties();
    }*/

    //Add checks for additional derived properties here...

  }
  //--

  //--Ibc Connection Parties--
  /*private _ibcConnectionParty1: IbcConnectionParty | undefined | null = null;
  private get ibcConnectionParty1(): IbcConnectionParty | undefined {
    if (this._ibcConnectionParty1 !== null) return this._ibcConnectionParty1;

    const chain_1 = this.property(IbcConnection.PropertyName.CHAIN_1);
    if (!chain_1) return this._ibcConnectionParty1 = undefined;

    return new IbcConnectionParty(this.pointer, 1, chain_1);
  }*/
  
  private _IbcConnectionPartyMap: Map<number, IbcConnectionParty> | null = null;

  private get IbcConnectionPartyMap(): Map<number, IbcConnectionParty> | undefined {
    if (this._IbcConnectionPartyMap === null) this.loadIbcConnectionParties();
    return this._IbcConnectionPartyMap ?? undefined;
  }

  private loadIbcConnectionParties(): void {
    if (this._IbcConnectionPartyMap !== null) return; // Already initialized

    const chain_1: Record<number, any> | undefined = this.property(IbcConnection.PropertyName.CHAIN_1);
    const chain_2: Record<number, any> | undefined = this.property(IbcConnection.PropertyName.CHAIN_2);
    if (!chain_1 || !chain_2) return;

    this._IbcConnectionPartyMap = new Map();
    this._IbcConnectionPartyMap.set(
      //IbcConnection.PropertyName.CHAIN_1,
      1,
      new IbcConnectionParty(this.pointer, IbcConnection.PropertyName.CHAIN_1, chain_1));
    this._IbcConnectionPartyMap.set(
      //IbcConnection.PropertyName.CHAIN_2,
      2,
      new IbcConnectionParty(this.pointer, IbcConnection.PropertyName.CHAIN_2, chain_2));
  }

  public ibcConnectionParty(key: number): IbcConnectionParty | undefined {
    return this.IbcConnectionPartyMap?.get(key);
  }

  /*public get(objectType: typeof IbcConnectionParty, key: number) {
    let ibcConnectionParty = this.IbcConnectionPartyMap?.get(key);
    return ibcConnectionParty;
  }*/


  /*public override get<T extends RegistryObject>(
    objectType: new (...args: any[]) => RegistryObject,
    key: RegistryObject["keyType"]
  ): T | undefined {
    if (objectType === IbcConnection) {
      return this.IbcConnectionPartyMap?.get(key) as T | undefined;
    }

    return super.get(objectType, key) as T;
  }*/

  public override getKeys<T extends RegistryObject>(
    objectType: new (...args: any[]) => RegistryObject
  ): Array<T["keyType"]> {
    if (objectType === IbcConnectionParty) return [
      IbcConnection.PropertyName.CHAIN_1,
      IbcConnection.PropertyName.CHAIN_2
    ];
    else if (objectType === IbcChannel) return Array.from(
      { length: this.property(IbcConnection.PropertyName.CHANNELS).length },
      (_, i) => i
    );
    else return [];
  }

  /*public override getSize<T extends RegistryObject>(
    objectType: new (...args: any[]) => RegistryObject
  ): T["keyType"] {
    if (objectType === IbcChannel) return this.property(IbcConnection.PropertyName.CHANNELS).length;
    else return -1;
  }*/

  /*public get(
    objectType: (new (...args: any[]) => RegistryObject),
    key: RegistryObject["keyType"]
  ): RegistryObject | undefined {
    if (objectType === IbcConnection) {
      return this.IbcConnectionPartyMap?.get(key);
    }
  }*/

  public ibcConnectionParties(
    conditions?: Array<(item: NewPointer<IbcConnectionParty>) => boolean>
  ): NewPointer<IbcConnectionParty>[] {
    if (!this.IbcConnectionPartyMap) return [];

    const array = Array.from(this.IbcConnectionPartyMap.keys())
      .map((key) => new NewPointer(IbcConnectionParty, this.pointer, key));

    return RegistryObject.objects<NewPointer<IbcConnectionParty>>(array, conditions);
  }
  /* f(x) call example:
   * 
   * where ibcConnectionPartyPointer is formatted like:
   * `{ibcConnectionKey: cosmoshub-osmosis, ibcConnectionPartyKey: chain_1}`
   * 
   * condition = (ibcConnectionPartyPointer) => {
   *   const ibcConnectionParty = ChainRegistry.getInstance()
   *     .ibcConnection(ibcConnectionPartyPointer.ibcConnectionKey)?
   *     .ibcConnectionParty(ibcConnectionPartyPointer.ibcConnectionPartyKey);
   *   
   *   return (
   *     ibcConnectionParty.              property("client_id")     === "tendermint-07"
   *      &&
   *     ibcConnectionParty.              property("connection_id") === "connection-01"
   *      &&
   *     ibcConnectionParty.counterparty. property("client_id")     === "tendermint-07"
   *      &&
   *     ibcConnectionParty.counterparty. property("connection_id") === "connection-18"
   *   )
   * };
   */

  //--

  //--Utility--
  public static chainNamesToKey(chainNameA: string, chainNameB: string) {
    return [chainNameA, chainNameB].sort().join("-");
  }
  //--
}

export default IbcConnection;