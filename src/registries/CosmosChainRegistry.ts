import FsStructureEntry from '../types/FsStructureEntry.js';
import Directory from '../types/Directory.js';
import File from '../types/File.js';
import CONFIG from '../config.js';
import Pointer from '../types/Pointer.js';


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
chainDirectory.add(versionsFile);

const imagesDirectory = new FsStructureEntry(
  "ImagesDirectory",
  Directory,
  chainDirectory,
  null,
  () => "images"
);
chainDirectory.add(imagesDirectory);

const imageFile = new FsStructureEntry(
  "imageFile",
  File,
  imagesDirectory,
  null,
  (name) => name as string,
);
imagesDirectory.add(imageFile);

import RegistryObject from '../types/RegistryObject.js';
import RegistryStructureEntry from '../types/RegistryStructureEntry.js';

export const CosmosChainRegistry = new Map();

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

const chainImage = new RegistryStructureEntry(
  "ChainImage",
  0,
  "Chain",
  (parent: RegistryObject): any[] => {
    return parent.property("images") || [];
  },
  null,
  (element: any): any => element
);
CosmosChainRegistry.set("ChainImage", chainImage);

const traceTypesList = {
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

const assetOverrideProperties: Map<string, (any: any, args?: any) => any> = new Map;
assetOverrideProperties.set(
  "traces",
  (asset: RegistryObject, args: string[]): RegistryObject[] | undefined => {
    const traceTypes: string[] = args ? args : Object.values(traceTypesList);
    const lastTrace: RegistryObject | undefined = asset.get("Trace", 0);
    if (!lastTrace) return undefined;
    const traceType: string | undefined = lastTrace?.property("type");
    if (!traceType || !traceTypes.includes(traceType)) return undefined;
    const previousTraces: RegistryObject[] | undefined = lastTrace?.property("assetPointer")?.object?.
      property("traces", traceTypes);
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

    const traceTypes: string[] = Object.values(traceTypesList);

    if (propertyName === "traces" && traceTypes.length) {
      return asset.property(propertyName, traceTypes);
    }
    const VALUE = asset.property(propertyName, false);
    if (VALUE) return VALUE;

    if (!traceTypes.length) return undefined;
    if (!traceTypes.includes(asset.get("Trace", 0)?.property("type")!)) return undefined;

    return asset.get("Trace", 0)?.property("assetPointer")?.object?.property(propertyName, traceTypes);
  };

const assetDefaultArgs = Object.values(traceTypesList);

const asset = new RegistryStructureEntry(
  "Asset",
  "",
  "Chain",
  (parent: RegistryObject): any[] =>
    chainDirectory.getDirectories(parent.pointer.key as string)[0]?.find(assetlistFile.name(), File)?.contents.assets,
  (element: any): string => element.base,
  (element: any): any => element,
  assetOverrideProperties,
  assetDerivedProperties,
  assetArgsProperty,
  assetDefaultArgs
);
CosmosChainRegistry.set("Asset", asset);

const denomUnit = new RegistryStructureEntry(
  "DenomUnit",
  0,
  "Asset",
  (parent: RegistryObject): any[] => {
    return parent.property("denom_units", false) || [];
  },
  null,
  (element: any): any => element
);
CosmosChainRegistry.set("DenomUnit", denomUnit);

const assetImage = new RegistryStructureEntry(
  "AssetImage",
  0,
  "Asset",
  (parent: RegistryObject): any[] => {
    return parent.property("images") || [];
  },
  null,
  (element: any): any => element
);
CosmosChainRegistry.set("AssetImage", assetImage);

const traceDerivedProperties: Map<string, (any: any) => any> = new Map;
traceDerivedProperties.set(
  "assetPointer",
  (trace: RegistryObject): Pointer | undefined => {
    return trace.root.
      get("Chain", trace.property("counterparty")?.chain_name)?.
      get("Asset", trace.property("counterparty")?.base_denom)?.
      pointer;
  }
);

const trace = new RegistryStructureEntry(
  "Trace",
  -1,
  "Asset",
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
  const assetlistFileExists = directory.find(assetlistFile.name(), File) ? true : false;
  const chainFileExists = directory.find(chainFile.name(), File) ? true : false;
  return assetlistFileExists || chainFileExists;
}
