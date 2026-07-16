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
import { FileImportNode } from '../mapping/import/FileImportNode.js';
import { type ImportNode } from '../mapping/import/ImportNode.js';
import { JsonFileReader } from '../mapping/discovery/JsonFileReader.js';
import { IdentitySource } from '../mapping/import/IdentitySource.js';
import { Path } from '../mapping/import/Path.js';
import { ImportPipeline } from '../mapping/pipeline/ImportPipeline.js';
import { DiscoveryImportNode } from '../mapping/import/DiscoveryImportNode.js';
import { basename, capture, captureScalar, case_, concat, current, directoryName, json, literal, propertyName } from '../dsl/expression/functions.js';
import { every, some, isDirectory, isFile, contains, isNull, isNotNull } from '../dsl/predicate/functions.js';
import { SelfNavigator } from '../mapping/discovery/navigation/SelfNavigator.js';
import { DirectoryNavigator } from '../mapping/discovery/navigation/DirectoryNavigator.js';
import { DiscoveryNode } from '../mapping/discovery/DiscoveryNode.js';
import { JsonDecoder } from '../mapping/discovery/decoding/JsonDecoder.js';
import { JsonObjectNavigator } from '../mapping/discovery/navigation/JsonObjectNavigator.js';

const CCR1_PATH: string = '../chain-registry';

EngineRegistry.getInstance().newEngine();
const engine = EngineRegistry.getInstance().engine();
const sql: PostgresInputBatch = engine.input() as PostgresInputBatch;

export const getChainRegContents = () => {

  console.log("starting chain reg");

  const chainDirectoryImportMapping = new ImportMapping({
    tableName: "Chains",
    source: new IdentitySource(),
    fields: {
      chainDirectoryName: captureScalar("chainDirectoryName"),
      networkKind: captureScalar("networkKind"),
      networkType: captureScalar("networkType")
    }
  });

  // const chainDirectoryImportMapping2 = new ImportMapping({
  //   accepts: "chainDirectory", // the import identity will be the same as this discovery node type's identity
  //   tableName: "Chains",
  //   fields: {
  //     chainDirectoryName: captureScalar("chainDirectoryName"),
  //     networkKind: captureScalar("networkKind"),
  //     networkType: captureScalar("networkType")
  //   },
  //   children: [
  //     chainFileImportMapping3 // when these child import mappings are triggered to be imported,
  //     // we also pass the identity of this very mapping (the chain direcoty name )
  //     // as "chain.json" would be excluded, unless overridden
  //   ]
  // });

  // const chainFileImportMapping3 = new ImportMapping({
  //   source: capture("chain"),
  //   fields: {
  //     displayName: concat(
  //       path("pretty_name"),
  //       literal(" ("),
  //       path("chain_id"),
  //       literal(")")
  //     )
  //   },
  //   prefix: "ChainFile",
  //   children: [
  //     logoUrisImportMapping4
  //   ],
  // });

  // const logoURIsImportMapping4 = new ImportMapping({
  //   accepts: "logoUrisNode", // overrides parent identity strategy,
  //   // can be used to infer source (because logo_URIs is sometimes in chain, other times in asset)
  //   tableName: "Images",
  //   //source: parent().path("logo_URIs"), might not need
  //   fields: {
  //     type: literal("logo"),
  //     owner: captureScalar("owner")
  //   }
  // });

  const chainDirectoryImporter = new DiscoveryImportNode({
    acceptsNodeType: "chainDirectory",
    mapping: chainDirectoryImportMapping,
  });

  // const chainDirectoryImporter2 = new DiscoveryImportNode({
  //   acceptsNodeType: "chainFile",
  //   mapping: chainDirectoryImportMapping2,
  // });

  const logoUrisNode = new DiscoveryNode({
    navigator: new JsonObjectNavigator(),
    matcher: propertyName().eq("logo_URIs"),
    nodeType: "LogoUris",
    children: [],
  });

  const chainFileImportMapping2 = new ImportMapping({
    tableName: "Chains",
    source: new IdentitySource(),
    fields: {
      prettyName: capture("chain").path("pretty_name").scalar()
    }
  });

  const chainFileImporter2 =
    new DiscoveryImportNode({
      acceptsNodeType: "chainFile",
      mapping: chainFileImportMapping2,
    });

  // const chainFileImportMapping3 = new ImportMapping({
  //   tableName: "Chains",
  //   source: capture("chain"), // an entire object, not a scalar. Flatten and import all properties of entire object
  //   fields: {
  //     displayName: concat(
  //       path("pretty_name"), // i.e., path from the source object
  //       literal(" ("),
  //       path("chain_id"),
  //       literal(")")
  //     )
  //   },
  //   prefix: "ChainFile",
  //   children: [
  //     logoUrisImportMapping3 // within the flattened source object, "logo_URIs" will be skipped,
  //   ],
  //   identityNode: "chainDirectory"
  // });

  // const logoURIsImportMapping4 = new ImportMapping({
  //   tableName: "Images",
  //   source: capture("logo_URIs"), // an entire object, not a scalar. Flatten and import all properties of entire object
  //   fields: {
  //     type: literal("logo"),
  //     owner: captureScalar("owner")
  //   },
  //   //identityNode: "???" // could be used by either chain or by asset, so I can't really say chainDirectory or asset index
  //   identity: field("owner") // just another idea
  // });

  const chainFileNode = new DiscoveryNode({
    navigator: new DirectoryNavigator(),
    matcher: every(isFile(), basename().eq("chain.json")),
    decoder: new JsonDecoder(),
    nodeType: "chainFile",
    captures: {
      chain: current()
    },
    children: [
      logoUrisNode
    ],   
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
        chainFileNode
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
      //traversalMode: TraversalMode.Self,
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
      //traversalMode: TraversalMode.Children,
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

  const registry =
    new DiscoveryNode({
      navigator: new SelfNavigator(Directory),
      matcher: isDirectory(),
      children: [
        mainnetScope,
        testnetScope
      ],
      nodeType: "registry"
    });

  const registryRootDirectory = new Directory("./temp");

  const feeTokenImportMapping = 
    new ImportMapping({
      tableName: "FeeTokens",
      source: Path.parse("fees.fee_tokens"),
    });

  const stakingTokenImportMapping = 
    new ImportMapping({
      tableName: "StakingTokens",
      source: Path.parse("staking.staking_tokens")
  });
    
  const logoUrisImportMapping = 
    new ImportMapping({
      tableName: "Images",
      source: Path.parse("logo_URIs"),
      prefix: "",
      fields: {
        owner: captureScalar("owner"),
        type: literal("logo")
      }
    });

  const imagesImportMapping = 
    new ImportMapping({
      tableName: "Images",
      source: Path.parse("images"),
      prefix: "",
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

  const chainFileImportMapping = new ImportMapping({
    tableName: "Chains",
    source: new IdentitySource(),
    fields: {
      displayName: concat(
          json("pretty_name"),
          literal(" ("),
          json("chain_id"),
          literal(")")
        )
    },
    captures: {
      owner: concat(
          literal("Chain:"),
          captureScalar("chainDirectoryName")
        )
    },
    children: [
      feeTokenImportMapping,
      stakingTokenImportMapping,
      logoUrisImportMapping,
      imagesImportMapping
    ]
  });

  const chainFileImporter =
    new FileImportNode({
      acceptsNodeType: "chainDirectory",
      matcher: every(isFile(), basename().eq("chain.json")),
      reader: new JsonFileReader(),
      mapping: chainFileImportMapping,
      directoryObjectName: "chainDirectory",
    });

  const assetsImportMapping = 
    new ImportMapping({
      tableName: "Assets",
      source: Path.parse("assets"),
      captures: {
        owner: concat(
            literal("Asset:"),
            captureScalar("chainDirectoryName"),
            literal(":"),
            json("base")
          ),
        assetBase: json("base")
      },
      children: [
        logoUrisImportMapping,
        imagesImportMapping
      ],
    });

  const assetlistFileImportMapping = new ImportMapping({
    tableName: "Chains",
    source: new IdentitySource(),
    children: [
      assetsImportMapping,
    ]
  });

  const assetlistFileImporter =
    new FileImportNode({
      acceptsNodeType: "chainDirectory",
      matcher: every(isFile(), basename().eq("assetlist.json")),
      reader: new JsonFileReader(),
      mapping: assetlistFileImportMapping,
      directoryObjectName: "chainDirectory",
    });

  const importers: ImportNode[] = [
    chainDirectoryImporter,
    chainFileImporter2,
    //chainFileImporter,
    assetlistFileImporter,
    //versionsFileImporter,
  ];

  const result = ImportPipeline.build({
    registry,
    importers,
    databaseName: "Test Registry",
    root: registryRootDirectory,
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