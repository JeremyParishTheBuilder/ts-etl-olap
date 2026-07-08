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
import {
  AnyDirectoryMatcher,
  DirectoryContentIncludesMatcher,
  DirectoryNameMatcher,
} from "../mapping/discovery/DirectoryMatcher.js";
import { TraversalMode } from '../mapping/discovery/TraversalMode.js';
import { CollectionNode } from '../mapping/discovery/CollectionNode.js';
import { ScopeNode } from '../mapping/discovery/ScopeNode.js';
import { FileNameMatcher } from '../mapping/discovery/FileMatcher.js';
import { ImportMapping } from '../mapping/import/ImportMapping.js';
import { DerivedField } from '../mapping/import/DerivedField.js';
import { FileImportNode } from '../mapping/discovery/FileImportNode.js';
import { type ImportNode } from '../mapping/import/ImportNode.js';
import { JsonFileReader } from '../mapping/discovery/JsonFileReader.js';
import { IdentitySourceResolver } from '../mapping/import/IdentitySourceResolver.js';
import { LambdaValueResolver } from '../mapping/value/LambdaValueResolver.js';
import { PrimitiveJsonValueResolver } from '../mapping/value/PrimitiveJsonValueResolver.js';
import { JsonPathResolver } from '../mapping/import/JsonPathResolver.js';
import { ImportPipeline } from '../mapping/pipeline/ImportPipeline.js';
import { DiscoveryImportNode } from '../mapping/import/DiscoveryImportNode.js';
import { CaptureField } from '../mapping/utils/helpers.js';

const CCR1_PATH: string = '../chain-registry';

EngineRegistry.getInstance().newEngine();
const engine = EngineRegistry.getInstance().engine();
const sql: PostgresInputBatch = engine.input() as PostgresInputBatch;

export const getChainRegContents = () => {

  console.log("starting chain reg");

  const chainDirectoryImportMapping = new ImportMapping({
    tableName: "Chains",
    sourceResolver: new IdentitySourceResolver(),
    derivedFields: [
      CaptureField("chainDirectoryName"),
      CaptureField("networkKind"),
      CaptureField("networkType")
    ]
  });

  const chainDirectoryImporter = new DiscoveryImportNode({
    acceptsNodeType: "chainDirectory",
    mapping: chainDirectoryImportMapping,
  });

  const chainCollection = 
    new CollectionNode({
      matcher: new DirectoryContentIncludesMatcher("chain.json"),
      children: [],
      nodeType: "chainDirectory",
      captureName: "chainDirectoryName",
      // captures: [
      //   new Capture({
      //     name: "chainDirecotryName",
      //     resolver: directoryName()
      //   })
      // ],
      // captures: {
      //   chainDirectoryName: directoryName(),
      // }
  });

  const cosmosScope =
    new ScopeNode({
      matcher: new AnyDirectoryMatcher(),
      traversalMode: TraversalMode.Self,
      children: [
        chainCollection
      ],
      nodeType: "networkType",
      captureName: "networkType",
      captureResolver: () => "Cosmos",
    });

  const nonCosmosScope =
    new ScopeNode({
      matcher: new DirectoryNameMatcher("_non-cosmos"),
      traversalMode: TraversalMode.Children,
      children: [
        chainCollection
      ],
      nodeType: "networkType",
      captureName: "networkType",
      captureResolver: () => "Non-cosmos",
    });

  const mainnetScope =
    new ScopeNode({
      matcher: new AnyDirectoryMatcher(),
      traversalMode: TraversalMode.Self,
      children: [
        cosmosScope,
        nonCosmosScope,
      ],
      nodeType: "networkKind",
      captureName: "networkKind",
      captureResolver: () => "Mainnet",
    });

  const testnetScope =
    new ScopeNode({
      matcher: new DirectoryNameMatcher("testnets"),
      traversalMode: TraversalMode.Children,
      children: [
        cosmosScope,
        nonCosmosScope,
      ],
      nodeType: "networkKind",
      captureName: "networkKind",
      captureResolver: () => "Testnet",
    });

  const registry =
    new ScopeNode({
      matcher: new AnyDirectoryMatcher(),
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
      sourceResolver: JsonPathResolver.parse("fees.fee_tokens"),
    });

  const stakingTokenImportMapping = 
    new ImportMapping({
      tableName: "StakingTokens",
      sourceResolver: JsonPathResolver.parse("staking.staking_tokens"),
  });
    
  const logoUrisImportMapping = 
    new ImportMapping({
      sourceResolver: JsonPathResolver.parse("logo_URIs"),
      derivedFields: [
        CaptureField("owner")
      ],
    });

    const imagesImportMapping = 
      new ImportMapping({
        sourceResolver: JsonPathResolver.parse("images"),
        derivedFields: [
          CaptureField("owner")
        ],
      });

  const chainFileImportMapping = new ImportMapping({
    tableName: "Chains",
    sourceResolver: new IdentitySourceResolver(),
    derivedFields: [
      new DerivedField(
        "displayName", // would show up as column name: ChainJson.displayName 
        new LambdaValueResolver(ctx =>
          `${(ctx.source as any).pretty_name} (${(ctx.source as any).chain_id})`
        )
      )
    ],
    captures: [
      new DerivedField(
        "owner",
        new LambdaValueResolver(ctx =>
          `Chain:${ctx.capture("chainDirectoryName")}`
        )
      )
    ],
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
      matcher: new FileNameMatcher("chain.json"),
      reader: new JsonFileReader(),
      mapping: chainFileImportMapping,
      directoryObjectName: "chainDirectory",
    });

  const assetsImportMapping = 
    new ImportMapping({
      tableName: "Assets",
      sourceResolver: JsonPathResolver.parse("assets"),
      captures: [
        new DerivedField(
          "owner",
          new LambdaValueResolver(ctx =>
            `Asset:${
              ctx.capture("chainDirectoryName")
            }:${
              new PrimitiveJsonValueResolver(
                JsonPathResolver.parse("base")
              ).resolve(ctx)
            }`
          )
        ),
        new DerivedField(
          "assetBase",
          new PrimitiveJsonValueResolver(
            JsonPathResolver.parse("base")
          )
        )
      ],
      nestedMappings: [
        logoUrisImportMapping,
        imagesImportMapping
      ],
    });

  const assetlistFileImportMapping = new ImportMapping({
    tableName: "Chains",
    sourceResolver: new IdentitySourceResolver(),
    nestedMappings: [
      assetsImportMapping,
    ]
  });

  const assetlistFileImporter =
    new FileImportNode({
      acceptsNodeType: "chainDirectory",
      matcher: new FileNameMatcher("assetlist.json"),
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
  }



  const chainResult = sql.select("*").from("Chains").execute()[0];
  console.log("chainResult");
  console.log(chainResult);


  const logoURIsResult = sql.select("*").from("LogoURIs").execute()[0];
  console.log("logoURIsResult");
  console.log(logoURIsResult);

  const imagesResult = sql.select("*").from("Images").execute()[0];
  console.log("imagesResult");
  console.log(imagesResult);

  const denom_units = sql.select("*").from("DenomUnits").execute()[0];
  console.log("denom_units");
  console.log(denom_units);

  console.log("created chain reg");
  
};