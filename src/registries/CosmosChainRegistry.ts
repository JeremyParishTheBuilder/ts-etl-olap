import FsStructureEntry from '../types/FsStructureEntry.js';
import Directory from '../types/Directory.js';
import File from '../types/File.js';
import CONFIG from '../config.js';


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
import ChainRegistry from '../types/ChainRegistry.js';
import Chain from '../types/Chain.js';
//import Version from '../types/Version.js'
import Asset from '../types/Asset.js'
import Trace from '../types/Trace.js'
import IbcConnection from '../types/IbcConnection.js'
import IbcChannel from '../types/IbcChannel.js'

export const CosmosChainRegistry = new Map();

export const CosmosChainRegistryTypes = {
  VERSION: "version",
  CHAIN: "chain"
} as const;

const chainRegistry = new RegistryStructureEntry(
  ChainRegistry,
  "",
  null,
  () => chainRegistryFs.getDirectories(),
  () => "Cosmos Chain Registry",
  () => null
);
CosmosChainRegistry.set(ChainRegistry, chainRegistry);

const chain = new RegistryStructureEntry(
  Chain,
  "",
  ChainRegistry,
  (parent: ChainRegistry): Directory[] => {
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
CosmosChainRegistry.set(Chain, chain);

const asset = new RegistryStructureEntry(
  Asset,
  "",
  Chain,
  //(parent: Chain) => parent.directory()?.find(assetlistFile.name(), File)?.contents.assets,
  //(parent: Chain) => parent.file(assetlistFile.name())?.contents.assets,
  (parent: Chain): any[] => chainDirectory.getDirectories(parent.pointer.key)[0]?.find(assetlistFile.name(), File)?.contents.assets,
  //(parent: Chain): any => assetlistFile.getDirectories(parent.pointer.key)[0].find(assetlistFile.name(), File)?.contents.assets,
  //Question: Do we want RegistryObject's to have .file and .directory functions for key locations?
  (element: any): string => element.base,
  (element: any): any => element
);
CosmosChainRegistry.set(Asset, asset);

const trace = new RegistryStructureEntry(
  Trace,
  -1,
  Asset,
  /*(parent: Asset): any[] => {
    const traces = parent.property("traces")
    if (!traces) return [];
    return [traces[traces.length - 1]];
  },*/
  (parent: Asset): (Trace | undefined)[] => [parent.lastTrace],
  (element: any): number => 1,
  (element: any): any => element
);
CosmosChainRegistry.set(Trace, trace);

class Version extends RegistryObject { }
const version = new RegistryStructureEntry(
  Version,
  "",
  Chain,
  (parent: Chain): any[] => chainDirectory.getDirectories(parent.pointer.key)[0]?.find(versionsFile.name(), File)?.contents.versions,
  (element: any): string => element.name,
  (element: any): any => element
);
CosmosChainRegistry.set(Version, version);

const ibcConnection = new RegistryStructureEntry(
  IbcConnection,
  "",
  ChainRegistry,
  (parent: ChainRegistry): any[] => {
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
CosmosChainRegistry.set(IbcConnection, ibcConnection);

const ibcChannel = new RegistryStructureEntry(
  IbcChannel,
  -1,
  IbcConnection,
  //(parent: IbcConnection): any[] => ibcFile.getFiles(parent.pointer.key)[0]?.contents.channels,
  (parent: IbcConnection): any[] => parent.property("channels") || [],
  null,
  (element: any): any => element
);
CosmosChainRegistry.set(IbcChannel, ibcChannel);

/*import fs from 'fs';
import path from 'path';*/

function isChain(directory: Directory): boolean {
  //if (directory._isChain !== null) return directory._isChain;
  //const assetlistFileExists = fs.existsSync(path.join(directory.fullPath, Chain.FileName.ASSETLIST));
  const assetlistFileExists = directory.find(Chain.FileName.ASSETLIST, File) ? true : false;
  //const chainFileExists = fs.existsSync(path.join(directory.fullPath, Chain.FileName.CHAIN
  const chainFileExists = directory.find(Chain.FileName.CHAIN, File) ? true : false;
  return assetlistFileExists || chainFileExists;
  //return directory._isChain = assetlistFileExists || chainFileExists;
}

/*function getAssetKeysForChain(chain: Chain): Asset["keyType"][] {
  return (
    chain.file(Chain.FileName.ASSETLIST)?.contents?.assets as { base: string }[]
  )?.map((asset) => asset.base) || [];
}

function getVersionKeysForChain(chain: Chain): Version["keyType"][] {
  return (
    chain.file(Chain.FileName.VERSIONS)?.contents?.versions as { name: string }[]
  )?.map((version) => version.name) || [];
}

function getChainKeys(): Chain["keyType"][] {
  const keys: Chain["keyType"][] = [];
  const directories = (chainDirectory.parent as FsStructureEntry).getDirectories();
  directories.forEach((directory) => {
    directory?.contents.forEach((directoryContent) => {
      if (directoryContent instanceof Directory && directoryContent.isChain) {
        keys.push(directoryContent.basename);
      }
    });
  });
  return keys;
}*/

/*function getKeys<T extends RegistryObject>(key: RegistryObject["keyType"]): T["keyType"][]{
  const keys: this.pointer.parent["keyType"][] = [];
  const directories = (registryStrucutre[typeof T][directory(key)].getDirectories();
  directories.forEach((directory) => {
    const files = ;
    files.forEach(file => {
      file
      const jsonObjects = ;
      jsonObjects.forEach((jsonObject) => {
        jsonObject

      });
    });
    directory?.contents.forEach((directoryContent) => {
      if (directoryContent instanceof Directory && directoryContent.isChain) {
        keys.push(directoryContent.basename);
      }
    });
  });
  return keys;
}*/

/*function getChainKeys(): Chain["keyType"][] {
  const keys: Chain["keyType"][] = [];
  Object.values(this._multiChainDirectories).forEach((multiChainDirectory) => {
    multiChainDirectory?.contents.forEach((directoryContent) => {
      if (directoryContent instanceof Directory && directoryContent.isChain) {
        keys.push(directoryContent.basename);
      }
    });
  });
  return keys;
}

function getIbcConnectionKeys(): IbcConnection["keyType"][] {
  const keys: IbcConnection["keyType"][] = [];
  Object.values(this._ibcDirectories).forEach((ibcDirectory) => {
    ibcDirectory?.contents.forEach((directoryContent) => {
      if (directoryContent instanceof File && directoryContent.basename.endsWith('.json')) {
        const ibcConnectionKey = directoryContent.basename.replace(".json", "");
        keys.push(ibcConnectionKey);
      }
    });
  });
  return keys;
}*/

/*function getDirectories(fsStructure: any, id: string, key?: string): Directory[] {
  const entry = fsStructure[id];
  if (!entry) return [];

  // Root node (no parent)
  if (!entry.parent) {
    const rootDirectory = typeof entry.directory === "function"
      ? entry.directory()
      : entry.directory;

    return [rootDirectory];
  }

  const parentDirs = getDirectories(fsStructure, entry.parent);
  const directories: Directory[] = [];

  for (const parent of parentDirs) {
    const keys = key ? [key] : entry.types ?? [];

    for (const k of keys) {
      const dirName = entry.directory?.(k);
      if (!dirName) continue;

      const found = parent.find(dirName, Directory);
      if (found) directories.push(found);
    }
  }

  return directories;
}*/