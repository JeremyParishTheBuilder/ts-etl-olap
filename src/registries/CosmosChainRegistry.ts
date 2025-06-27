import FsStructureEntry from '../types/FsStructureEntry.js';
import Directory from '../types/Directory.js';
import File from '../types/File.js';
import CONFIG from '../config.js';
import NewPointer from '../types/NewPointer.js';


const chainRegistryFs = new FsStructureEntry(
  "ChainRegistry",
  Directory,
  new Directory('../chain-registry'),
  null,
  () => "."
);

const networkType = new FsStructureEntry(
  "NetworkType",
  Directory,
  chainRegistryFs,
  ["mainnet", "testnet"],
  (type) => type === "mainnet" ? "." : "testnets"
);

chainRegistryFs.add(networkType);

const ibcDirectory = new FsStructureEntry(
  "IbcDirectory",
  Directory,
  networkType,
  null,
  () => "_IBC"
);

const ibcFile = new FsStructureEntry(
  "IbcFile",
  Directory,
  ibcDirectory,
  null,
  (key) => key as string & ".json"
);

const chainType = new FsStructureEntry(
  "ChainType",
  Directory,
  networkType,
  ["cosmos", "non-cosmos"],
  (type) => type === "cosmos" ? "." : "_non-cosmos"
);

networkType.add(chainType);

const chainDirectory = new FsStructureEntry(
  "ChainDirectory",
  Directory,
  chainType,
  null,
  (key) => key as string,
);

chainType.add(chainDirectory);

const assetlistFile = new FsStructureEntry(
  "assetlistFile",
  File,
  chainDirectory,
  null,
  () => "assetlist.json"
);

chainDirectory.add(assetlistFile);

const chainFile = new FsStructureEntry(
  "chainFile",
  File,
  chainDirectory,
  null,
  () => "chain.json"
);

chainDirectory.add(chainFile);

const versionsFile = new FsStructureEntry(
  "chainFile",
  File,
  chainDirectory,
  null,
  () => "versions.json"
);

chainDirectory.add(versionsFile); //adds versionsFile to chainDirectory::files array,
//and makes sure versionsFile parent is chainDirectory.

import RegistryObject from '../types/RegistryObject.js';
import RegistryStructureEntry from '../types/RegistryStructureEntry.js';
//import ChainRegistry from '../types/ChainRegistry.js';
import Chain from '../types/Chain.js';
//import Version from '../types/Version.js'
import Asset from '../types/Asset.js'
import Trace from '../types/Trace.js'
//import IbcConnection from '../types/IbcConnection.js'
//import IbcChannel from '../types/IbcChannel.js'

export const CosmosChainRegistry = new Map();

export const CosmosChainRegistryTypes = {
  VERSION: "version",
  CHAIN: "chain"
} as const;

const chainRegistry = new RegistryStructureEntry(
  "RegistryRoot",
  "",
  null,
  () => chainRegistryFs.getDirectories(),
  () => "Cosmos",
  () => null
);
CosmosChainRegistry.set("RegistryRoot", chainRegistry);

const chain = new RegistryStructureEntry(
  "Chain",
  "",
  "RegistryRoot",
  (parent: RegistryObject): Directory[] => {
    const directories: Directory[] = [];
    chainType.getDirectories().forEach(multiChainDirectory => {
      multiChainDirectory.contents.forEach(content => {
        if (content instanceof Directory && isChain(content)) directories.push(content);
      });
    });
    return directories;
  },
  (element: Directory) => element.basename,
  (element: Directory) => element.find(chainFile.name(), File)?.contents
);
CosmosChainRegistry.set("Chain", chain);

const assetOverrideProperties: Map<string, (any: any, args?: any) => any> = new Map;
assetOverrideProperties.set(
  "traces",
  (asset: RegistryObject, args: string[]): RegistryObject[] | undefined => {
    const traceTypes: string[] = args ? args : Object.values(Trace.Type);

    const lastTrace: RegistryObject | undefined = asset.get("Trace", 0);
    if (!lastTrace) return undefined;
    //console.log("lastTrace");
    //console.log(lastTrace);
    //console.log("Should be type:");
    const traceType: string | undefined = lastTrace?.property(Trace.PropertyName.TYPE);
    //console.log("traceType:");
    //console.log(traceType);
    if (!traceType || !traceTypes.includes(traceType)) return undefined;

    //console.log("Requesting previousTraces:");
    //console.log("to add onto lastTrace:");
    //console.log(lastTrace);
    const previousTraces: RegistryObject[] | undefined = lastTrace?.property("assetPointer")?.object?.
      property(Asset.PropertyName.TRACES, traceTypes);
    //console.log("previousTraces:");
    //console.log(previousTraces);
    return previousTraces ? [...previousTraces, lastTrace] : [lastTrace];
  }
);

const assetDerivedProperties: Map<string, (any: any) => any> = new Map;
assetDerivedProperties.set(
  "decimals",
  (asset: RegistryObject): RegistryObject | undefined => {
    const display = asset.property("display");
    const denom_units = asset.property("denom_units");
    if (!display || !denom_units) return undefined;

    for (let i = denom_units.length - 1; i >= 0; --i) {
      if (denom_units[i].denom === display) {
        return denom_units[i].exponent;
      }
    }

    return undefined;
  }
);

const assetArgsProperty: (any: any, propertyName: string, args?: any) => any =
  (
    asset: RegistryObject,
    propertyName: string,
    args?: string[] | boolean
  ): any | undefined => {

    const traceTypes: string[] = Object.values(Trace.Type);

    //console.log("Called assetArgsProperty");

    //bypass cache when looking for traces
    //console.log(traceTypes);
    //console.log(propertyName);
    if (propertyName === Asset.PropertyName.TRACES && traceTypes.length) {
      //console.log("Was this true?");
      return asset.property(propertyName, traceTypes);
    }

    //console.log("checking for value");
    const VALUE = asset.property(propertyName, false); // this is where it's just repeating, calling itself. Want it to call a more basic version
    //console.log("value is");
    //console.log(VALUE);
    if (VALUE) return VALUE;
    //console.log("did not return value");

    if (!traceTypes.length) return undefined; // Stop if not to inherit, such as when traceTypes = []
    if (!traceTypes.includes(asset.get("Trace", 0)?.property(Trace.PropertyName.TYPE)!)) return undefined; // Stop inheriting if wrong trace type

    return asset.get("Trace", 0)?.property("assetPointer")?.object?.property(propertyName, traceTypes);
  };

const assetDefaultArgs = Object.values(Trace.Type);

const asset = new RegistryStructureEntry(
  "Asset",
  "",
  "Chain",
  //(parent: Chain) => parent.directory()?.find(assetlistFile.name(), File)?.contents.assets,
  //(parent: Chain) => parent.file(assetlistFile.name())?.contents.assets,
  (parent: RegistryObject): any[] => chainDirectory.getDirectories(parent.pointer.key as string)[0]?.find(assetlistFile.name(), File)?.contents.assets,
  //(parent: Chain): any => assetlistFile.getDirectories(parent.pointer.key)[0].find(assetlistFile.name(), File)?.contents.assets,
  //Question: Do we want RegistryObject's to have .file and .directory functions for key locations?
  (element: any): string => element.base,
  (element: any): any => element,
  assetOverrideProperties,
  assetDerivedProperties,
  assetArgsProperty,
  assetDefaultArgs
);
CosmosChainRegistry.set("Asset", asset);

const traceDerivedProperties: Map<string, (any: any) => any> = new Map;
traceDerivedProperties.set(
  "assetPointer",
  (trace: RegistryObject): NewPointer | undefined => {
    return trace.root.
      get("Chain", trace.property("counterparty")?.chain_name)?.
      get("Asset", trace.property("counterparty")?.base_denom)?.
      pointer;
    /*return trace.root.pointer.object?.find("Trace", [
      (tracePtr) => tracePtr.parent?.object?.property("base") === trace.property("counterparty")?.base_denom,
      (tracePtr) => tracePtr.parent?.parent?.object?.property("chain_name") === trace.property("counterparty")?.chain_name
    ])?.[0];*/
  }
);

const trace = new RegistryStructureEntry(
  "Trace",
  -1,
  "Asset",
  /*(parent: Asset): any[] => {
    const traces = parent.property("traces")
    if (!traces) return [];
    return [traces[traces.length - 1]];
  },*/
  (parent: RegistryObject): (RegistryObject | undefined)[] => {
    const tracesJson: any = parent.property("traces", false);
    return [tracesJson?.[tracesJson.length - 1]];
  },
  (element: any): number => 0,
  (element: any): any => element,
  null,
  traceDerivedProperties
);
CosmosChainRegistry.set("Trace", trace);

const version = new RegistryStructureEntry(
  "Version",
  "",
  "Chain",
  (parent: RegistryObject): any[] => chainDirectory.getDirectories(parent.pointer.key as string)[0]?.find(versionsFile.name(), File)?.contents.versions,
  (element: any): string => element.name,
  (element: any): any => element
);
CosmosChainRegistry.set("Version", version);

const ibcConnection = new RegistryStructureEntry(
  "IbcConnection",
  "",
  "RegistryRoot",
  (parent: RegistryObject): any[] => {
    const ibcFiles: File[] = [];
    /*networkType.getDirectories().forEach(
      directory => {
        const ibcDir: Directory | undefined = directory.find(ibcDirectory.name(), Directory);
        ibcDir?.contents.forEach(ibcDirContent => {
          if (ibcDirContent instanceof File && ibcDirContent.basename.includes(".json")) {
            ibcFiles.push(ibcDirContent);
          }
        });
      });*/
    ibcDirectory.getDirectories().forEach(ibcDir => {
      ibcDir.contents.forEach(content => {
        if (content instanceof File && content.basename.includes(".json")) {
          ibcFiles.push(content);
        }
      });
    });
    return ibcFiles;
  },
  (element: File): string => element.basename.substring(0, element.basename.lastIndexOf(".")),
  (element: File): any => element.contents
);
CosmosChainRegistry.set("IbcConnection", ibcConnection);

const ibcConnectionParty = new RegistryStructureEntry(
  "IbcChannelParty",
  -1,
  "IbcChannel",
  (parent: RegistryObject): any[] =>
    parent.property("chain_1") && parent.property("chain_2")
      ? [parent.property("chain_1"), parent.property("chain_2")]
      : [],
  null,
  (element: any): any => element
);
CosmosChainRegistry.set("IbcConnectionParty", ibcConnectionParty);

const ibcChannel = new RegistryStructureEntry(
  "IbcChannel",
  -1,
  "IbcConnection",
  (parent: RegistryObject): any[] => parent.property("channels") || [],
  null,
  (element: any): any => element
);
CosmosChainRegistry.set("IbcChannel", ibcChannel);

const ibcChannelParty = new RegistryStructureEntry(
  "IbcChannelParty",
  -1,
  "IbcChannel",
  (parent: RegistryObject): any[] =>
    parent.property("chain_1") && parent.property("chain_2")
      ? [parent.property("chain_1"), parent.property("chain_2")]
      : [],
  null,
  (element: any): any => element
);
CosmosChainRegistry.set("IbcChannelParty", ibcChannelParty);


function isChain(directory: Directory): boolean {
  //if (directory._isChain !== null) return directory._isChain;
  //const assetlistFileExists = fs.existsSync(path.join(directory.fullPath, Chain.FileName.ASSETLIST));
  const assetlistFileExists = directory.find(Chain.FileName.ASSETLIST, File) ? true : false;
  //const chainFileExists = fs.existsSync(path.join(directory.fullPath, Chain.FileName.CHAIN
  const chainFileExists = directory.find(Chain.FileName.CHAIN, File) ? true : false;
  return assetlistFileExists || chainFileExists;
  //return directory._isChain = assetlistFileExists || chainFileExists;
}
