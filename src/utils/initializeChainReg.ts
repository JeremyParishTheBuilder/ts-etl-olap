//import ChainRegistry from '../types/ChainRegistry.js';
// import RegistryObject from '../mapping/oldTypes/RegistryObject.js';
// import RegistryRoot from '../mapping/oldTypes/RegistryRoot.js';
// import Pointer from '../mapping/oldTypes/Pointer.js';
// import { CosmosChainRegistry } from '../registries/CosmosChainRegistry.js';
// import MultiRegistryRoot from '../mapping/oldTypes/MultiRegistryRoot.js';
//import { Database } from '../types/Database';

import { EngineRegistry } from '../engine/EngineRegistry.js';
import { type PostgresInputBatch } from '../input/PostgresInputBatch.js';

import { Directory } from "../mapping/discovery/Directory.js";
import { ImportMapping } from '../mapping/import/ImportMapping.js';
import { ImportPipeline } from '../mapping/pipeline/ImportPipeline.js';
import { basename, capture, captureScalar, case_, concat, current, value, literal, propertyName } from '../dsl/expression/functions.js';
import { every, some, isDirectory, isFile, contains, isNull, isNotNull } from '../dsl/predicate/functions.js';
import { SelfNavigator } from '../mapping/discovery/navigation/SelfNavigator.js';
import { DirectoryNavigator } from '../mapping/discovery/navigation/DirectoryNavigator.js';
import { DiscoveryNode } from '../mapping/discovery/DiscoveryNode.js';
import { JsonDecoder } from '../mapping/discovery/decoding/JsonDecoder.js';
import { StructuredObjectNavigator } from '../mapping/discovery/navigation/StructuredObjectNavigator.js';
import type { ImportContext } from '../mapping/import/ImportContext.js';
import { ImportRoot } from '../mapping/import/ImportRoot.js';
import { discovery, path } from '../mapping/import/dsl.js';
import { StructuredArrayNavigator } from '../mapping/discovery/navigation/StructuredArrayNavigator.js';
import { DiscoveryRoot } from '../mapping/discovery/DisscoveryRoot.js';
import { FsDiscoverySource } from '../mapping/discovery/DiscoverySource.js';

const CCR1_PATH: string = '../chain-registry';

EngineRegistry.getInstance().newEngine();
const engine = EngineRegistry.getInstance().engine();
const sql: PostgresInputBatch = engine.input() as PostgresInputBatch;

export const getChainRegContents = () => {

  console.log("starting chain reg");

  const logoUrisNode = new DiscoveryNode({
    navigator: new StructuredObjectNavigator(),
    matcher: propertyName().eq("logo_URIs"),
    nodeType: "LogoUris",
    children: [],
  });

  

  const feeTokensNode = new DiscoveryNode({
    navigator: new StructuredObjectNavigator(),
    matcher: propertyName().eq("fee_tokens"),
    nodeType: "FeeTokens",
    children: [],
  });

  const feesNode = new DiscoveryNode({
    navigator: new StructuredObjectNavigator(),
    matcher: propertyName().eq("fees"),
    nodeType: "Fees",
    children: [feeTokensNode],
  });

  // const explorersNode = new DiscoveryNode({
  //   navigator: new StructuredObjectNavigator(),
  //   matcher: propertyName().eq("explorers"),
  //   nodeType: "Explorers",
  //   children: [],
  // });

  // const assetNode = new DiscoveryNode({
  //   navigator: new StructuredArrayNavigator(),
  //   decoder: new JsonDecoder(),
  //   nodeType: "asset",
  //   captures: {
  //     base: value("base"),
  //     owner: concat(
  //       literal("Asset:"),
  //       captureScalar("chainDirectoryName"),
  //       literal(":"),
  //       current().path("base").scalar()
  //     ),
  //   },
  //   children: [],   
  // });

  // const assetlistFileNode = new DiscoveryNode({
  //   navigator: new DirectoryNavigator(),
  //   matcher: every(isFile(), basename().eq("assetlist.json")),
  //   decoder: new JsonDecoder(),
  //   nodeType: "assetlistFile",
  //   children: [
  //     assetNode
  //   ],   
  // });

  const chainFileNode = new DiscoveryNode({
    navigator: new DirectoryNavigator(),
    matcher: every(isFile(), basename().eq("chain.json")),
    decoder: new JsonDecoder(),
    nodeType: "chainFile",
    captures: {
      chain: current(),
      owner: concat(
        literal("Chain:"),
        capture("chain").path("chain_name").scalar()
      ),
    },
    children: [
    ],
  });

  const chainCollection = 
    new DiscoveryNode({
      navigator: new DirectoryNavigator(),
      matcher: contains(
        some(
          every(isFile(), basename().eq("chain.json")),
          every(isFile(), basename().eq("assetlist.json")),
        )
      ),
      children: [
        chainFileNode,
        //assetlistFileNode,
      ],
      nodeType: "chainDirectory",
      captures: {
        "chainDirectoryName": current().path("_basename")
      }
  });

  const cosmosScope =
    new DiscoveryNode({
      matcher: isDirectory(),
      navigator: new SelfNavigator(Directory),
      children: [
        chainCollection
      ],
      nodeType: "networkType",
      captures: {
        networkType: literal("Cosmos")
      }
    });

  const nonCosmosScope =
    new DiscoveryNode({
      navigator: new DirectoryNavigator(),
      matcher: every(isDirectory(), basename().eq("_non-cosmos")),
      children: [
        chainCollection
      ],
      nodeType: "networkType",
      captures: {
        networkType: literal("Non-cosmos")
      }
    });

  const mainnetScope =
    new DiscoveryNode({
      navigator: new SelfNavigator(Directory),
      matcher: isDirectory(),
      children: [
        cosmosScope,
        nonCosmosScope,
      ],
      nodeType: "networkKind",
      captures: {
        networkKind: literal("Mainnet")
      }
    });

  const testnetScope =
    new DiscoveryNode({
      navigator: new DirectoryNavigator(),
      matcher: every(isDirectory(), basename().eq("testnets")),
      children: [
        cosmosScope,
        nonCosmosScope,
      ],
      nodeType: "networkKind",
      captures: {
        networkKind: literal("Testnet")
      }
    });

  const testRegistryDiscoveryNode =
    new DiscoveryNode({
      navigator: new SelfNavigator(Directory),
      matcher: isDirectory(),
      captures: {
        registryName: literal("Test Cosmos Chain Registry")
      },
      children: [
        mainnetScope,
        testnetScope
      ],
      nodeType: "registry"
    });

  const registryRootDirectory = new Directory("./temp");

  const testRegistryRootDirectory =
    new FsDiscoverySource(registryRootDirectory);

  const testRegistryDiscoveryRoot =
    new DiscoveryRoot({
      source: testRegistryRootDirectory,
      discovery: testRegistryDiscoveryNode,
    });

// -----------------------

  const imagesImportMapping = 
    new ImportMapping({
      tableName: "Images",
      source: path("images"),
      fields: {
        owner: captureScalar("owner"),
        imageSyncOwner: case_([
          {
            when: every(
              isNull(value("image_sync.base_denom")),
              isNotNull(value("image_sync.chain_name"))
            ),
            then: concat(
              literal("Chain:"),
              value("image_sync.chain_name")
            )
          }, {
            when: isNotNull(value("image_sync.chain_name")),
            then: concat(
              literal("Asset:"),
              value("image_sync.chain_name"),
              literal(":"),
              value("image_sync.base_denom")
            )
          }],
          literal(null)
        )
      }
    });

  const logoUrisImportMapping = 
    new ImportMapping({
      tableName: "Images",
      source: path("logo_URIs"),
      fields: {
        owner: captureScalar("owner"),
        type: literal("logo")
      }
    });

  const chainFileImportMapping = new ImportMapping({
    source: discovery("chainFile"),
    tableName: "Chains",
    prefix: "ChainFile",
    fields: {
      displayName: concat(
          current().path("pretty_name").scalar(),
          literal(" ("),
          value("chain_id"),
          literal(")")
        ),
      owner: captureScalar("owner"),
    },
    children: [
      logoUrisImportMapping,
      imagesImportMapping,
    ]
  });

  const chainDirectoryImportMapping = new ImportMapping({
    source: discovery("chainDirectory"),
    tableName: "Chains",
    flatten: false,
    prefix: "ChainDirectory",
    fields: {
      chainDirectoryName: captureScalar("chainDirectoryName"),
      networkKind: captureScalar("networkKind"),
      networkType: captureScalar("networkType")
    },
    children: [
      chainFileImportMapping
    ]
  });

  const networkTypeImportMapping = new ImportMapping({
    source: discovery("networkType"),
    children: [
      chainDirectoryImportMapping,
      //ibcConnectionImportMapping,
    ]
  });

  const networkKindImportMapping = new ImportMapping({
    source: discovery("networkKind"),
    children: [
      networkTypeImportMapping
    ]
  });

  const testRegistryImportMapping = new ImportMapping({
    tableName: "Registries",
    fields: {
      registryName: captureScalar("registryName")
    },
    children: [
      networkKindImportMapping,
    ]
  });

  const testRegistryImportRoot = new ImportRoot({
    discovery: testRegistryDiscoveryRoot,
    mapping: testRegistryImportMapping
  });

  const importRoots: ImportRoot[] = [
    testRegistryImportRoot,
  ];

  

  const result = ImportPipeline.build({
    importRoots: importRoots,
    databaseName: "Test Registry",
    existingDatabases: engine.databases,
    sourceIdentity: "Test Registry"
  });

  engine.install(result.databases);
  
  console.log(EngineRegistry.getInstance().engine().databases.databases);

  sql.useDatabase("test registry").execute();

  console.log("tables:");
  const tablesMap = result.databases.requireByName("Test Registry").tables;
  for (const table of tablesMap.values()) {
    console.log(table.name);
    if (table.name === "Chains") {
      for (const column of table.columns.values()) {
        console.log(column.name);
      }
    }
    if (table.name === "Images") {
      for (const column of table.columns.values()) {
        console.log(column.name);
      }
    }
  }



  const chainResult = sql.select("*").from("Chains").execute()[0];
  console.log("chainResult");
  console.log(chainResult);


  // const logoURIsResult = sql.select("*").from("LogoURIs").execute()[0];
  // console.log("logoURIsResult");
  // console.log(logoURIsResult);

  const imagesResult = sql.select("*").from("Images").execute()[0];
  console.log("imagesResult");
  console.log(imagesResult);

  const feeTokens = sql.select("*").from("FeeTokens").execute()[0];
  console.log("feeTokens");
  console.log(feeTokens);


  const denom_units = sql.select("*").from("DenomUnits").execute()[0];
  console.log("denom_units");
  console.log(denom_units);

  console.log("created chain reg");
  
};