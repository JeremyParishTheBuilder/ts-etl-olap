//import ChainRegistry from '../types/ChainRegistry.js';
import RegistryObject from '../mapping/oldTypes/RegistryObject.js';
import RegistryRoot from '../mapping/oldTypes/RegistryRoot.js';
import Pointer from '../mapping/oldTypes/Pointer.js';
import { CosmosChainRegistry } from '../registries/CosmosChainRegistry.js';
import MultiRegistryRoot from '../mapping/oldTypes/MultiRegistryRoot.js';
//import { Database } from '../types/Database';

import { EngineRegistry } from '../engine/EngineRegistry.js';
import { type PostgresInputBatch } from '../input/PostgresInputBatch.js';

import { Directory } from "../mapping/discovery/Directory.js";
import { TraversalMode } from '../mapping/discovery/TraversalMode.js';
import { CollectionNode } from '../mapping/discovery/CollectionNode.js';
import { ScopeNode } from '../mapping/discovery/ScopeNode.js';
import { ImportMapping } from '../mapping/import/ImportMapping.js';
import { FileImportNode } from '../mapping/import/FileImportNode.js';
import { type ImportNode } from '../mapping/import/ImportNode.js';
import { JsonFileReader } from '../mapping/discovery/JsonFileReader.js';
import { IdentitySource } from '../mapping/import/IdentitySource.js';
import { JsonPath } from '../mapping/import/JsonPath.js';
import { ImportPipeline } from '../mapping/pipeline/ImportPipeline.js';
import { DiscoveryImportNode } from '../mapping/import/DiscoveryImportNode.js';
import { basename, capture, case_, concat, directoryName, json, literal } from '../dsl/expression/functions.js';
import { every, some, isDirectory, isFile, contains, isNull, isNotNull } from '../dsl/predicate/functions.js';

const CCR1_PATH: string = '../chain-registry';

EngineRegistry.getInstance().newEngine();
const engine = EngineRegistry.getInstance().engine();
const sql: PostgresInputBatch = engine.input() as PostgresInputBatch;

export const getChainRegContents = () => {

  console.log("starting chain reg");

  const chainDirectoryImportMapping = new ImportMapping({
    tableName: "Chains",
    sourceResolver: new IdentitySource(),
    fields: {
      chainDirectoryName: capture("chainDirectoryName"),
      networkKind: capture("networkKind"),
      networkType: capture("networkType")
    }
  });

  const chainDirectoryImporter = new DiscoveryImportNode({
    acceptsNodeType: "chainDirectory",
    mapping: chainDirectoryImportMapping,
  });

  const chainCollection = 
    new CollectionNode({
      matcher: contains(
        some(
          every(isFile(), basename().eq("chain.json")),
          every(isFile(), basename().eq("assetlist.json"))
        )
      ),
      children: [],
      nodeType: "chainDirectory",
      captures: {
        "chainDirectoryName": directoryName() // still works
        //"chainDirectoryName": basename() // error
      }
  });

  const cosmosScope =
    new ScopeNode({
      matcher: isDirectory(),
      traversalMode: TraversalMode.Self,
      children: [
        chainCollection
      ],
      nodeType: "networkType",
      captures: {
        networkType: literal("Cosmos")
      }
    });

  const nonCosmosScope =
    new ScopeNode({
      matcher: every(isDirectory(), basename().eq("_non-cosmos")),
      traversalMode: TraversalMode.Children,
      children: [
        chainCollection
      ],
      nodeType: "networkType",
      captures: {
        networkType: literal("Non-cosmos")
      }
    });

  const mainnetScope =
    new ScopeNode({
      matcher: isDirectory(),
      traversalMode: TraversalMode.Self,
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
    new ScopeNode({
      matcher: every(isDirectory(), basename().eq("testnets")),
      traversalMode: TraversalMode.Children,
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
    new ScopeNode({
      matcher: isDirectory(),
      traversalMode: TraversalMode.Self,
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
      sourceResolver: JsonPath.parse("fees.fee_tokens"),
    });

  const stakingTokenImportMapping = 
    new ImportMapping({
      tableName: "StakingTokens",
      sourceResolver: JsonPath.parse("staking.staking_tokens"),
  });
    
  const logoUrisImportMapping = 
    new ImportMapping({
      tableName: "Images",
      sourceResolver: JsonPath.parse("logo_URIs"),
      prefix: "",
      fields: {
        owner: capture("owner"),
        type: literal("logo")
      }
    });

  const imagesImportMapping = 
    new ImportMapping({
      tableName: "Images",
      sourceResolver: JsonPath.parse("images"),
      prefix: "",
      fields: {
        owner: capture("owner"),
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
    sourceResolver: new IdentitySource(),
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
          capture("chainDirectoryName")
        )
    },
    nestedMappings: [
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
      sourceResolver: JsonPath.parse("assets"),
      captures: {
        owner: concat(
            literal("Asset:"),
            capture("chainDirectoryName"),
            literal(":"),
            json("base")
          ),
        assetBase: json("base")
      },
      nestedMappings: [
        logoUrisImportMapping,
        imagesImportMapping
      ],
    });

  const assetlistFileImportMapping = new ImportMapping({
    tableName: "Chains",
    sourceResolver: new IdentitySource(),
    nestedMappings: [
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
    chainFileImporter,
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