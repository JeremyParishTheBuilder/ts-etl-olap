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
import { basename, capture, captureScalar, case_, concat, current, directoryName, json, literal } from '../dsl/expression/functions.js';
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

const CCR1_PATH: string = '../chain-registry';

EngineRegistry.getInstance().newEngine();
const engine = EngineRegistry.getInstance().engine();
const sql: PostgresInputBatch = engine.input() as PostgresInputBatch;

export const getChainRegContents = () => {

  console.log("starting chain reg");

  // const logoUrisNode = new DiscoveryNode({
  //   navigator: new StructuredObjectNavigator(),
  //   matcher: propertyName().eq("logo_URIs"),
  //   nodeType: "LogoUris",
  //   children: [],
  // });

  // const assetNode = new DiscoveryNode({
  //   navigator: new StructuredArrayNavigator(),
  //   decoder: new JsonDecoder(),
  //   nodeType: "asset",
  //   captures: {
  //     base: json("base"),
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
    children: [],   
  });

  const chainCollection = 
    new DiscoveryNode({
      navigator: new DirectoryNavigator(),
      matcher: contains(
        some(
          every(isFile(), basename().eq("chain.json")),
          every(isFile(), basename().eq("assetlist.json"))
        )
      ),
      children: [
        chainFileNode,
        //assetlistFileNode,
      ],
      nodeType: "chainDirectory",
      captures: {
        "chainDirectoryName": directoryName() // still works
        //"chainDirectoryName": basename() // error
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

  const testRegistryDiscoveryRoot =
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
              isNull(json("image_sync.base_denom")),
              isNotNull(json("image_sync.chain_name"))
            ),
            then: concat(
              literal("Chain:"),
              json("image_sync.chain_name")
            )
          }, {
            when: isNotNull(json("image_sync.chain_name")),
            then: concat(
              literal("Asset:"),
              json("image_sync.chain_name"),
              literal(":"),
              json("image_sync.base_denom")
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
          json("pretty_name"),
          literal(" ("),
          json("chain_id"),
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

  const registryRootDirectory = new Directory("./temp");

  const result = ImportPipeline.build({
    //registry: testRegistry, // should be an array of discovery roots
    importRoots: importRoots, // specifically, 'root' import mappings
    databaseName: "Test Registry",
    root: registryRootDirectory, // should no longer need a Directory--only the discovery roots
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

  const denom_units = sql.select("*").from("DenomUnits").execute()[0];
  console.log("denom_units");
  console.log(denom_units);

  console.log("created chain reg");
  
};