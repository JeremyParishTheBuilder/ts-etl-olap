//import ChainRegistry from '../types/ChainRegistry.js';
import RegistryObject from '../mapping/RegistryObject.js';
import RegistryRoot from '../mapping/RegistryRoot.js';
import Pointer from '../mapping/Pointer.js';
import { CosmosChainRegistry } from '../registries/CosmosChainRegistry.js';
import MultiRegistryRoot from '../mapping/MultiRegistryRoot.js';
//import { Database } from '../types/Database';

import { EngineRegistry } from '../engine/EngineRegistry.js';
import { type PostgresInputBatch } from '../input/PostgresInputBatch.js';

import { Directory } from "../mapping/Directory.js";
import {
  AnyDirectoryMatcher,
  DirectoryContentIncludesMatcher,
  DirectoryNameMatcher,
  DirectoryNameSetMatcher,
  NotDirectoryNameMatcher
} from "../mapping/DirectoryMatcher.js";
import { TraversalMode } from '../mapping/TraversalMode.js';
import { CollectionNode } from '../mapping/CollectionNode.js';
import { ScopeNode } from '../mapping/ScopeNode.js';
import { DiscoveryContext } from '../mapping/DiscoveryContext.js';
import { FileNameMatcher } from '../mapping/FileMatcher.js';
import { ImportMapping } from '../mapping/ImportMapping.js';
import { DerivedField } from '../mapping/DerivedField.js';
import { FileImportNode } from '../mapping/FileImportNode.js';
import { type ImportResult } from '../mapping/ImportResult.js';
import { type ImportNode } from '../mapping/ImportNode.js';
import { JsonFileReader } from '../mapping/JsonFileReader.js';
import { JsonPath } from '../mapping/JsonPath.js';
import { IdentitySourceResolver } from '../mapping/IdentitySourceResolver.js';
import { SchemaBuilder } from '../mapping/schema/SchemaBuilder.js';
import { LambdaValueResolver } from '../mapping/LambdaValueResolver.js';
import { JsonValueResolver } from '../mapping/JsonValueResolver.js';
//import { DatabaseBuilder } from '../mapping/DatabaseBuilder.js';

const CCR1_PATH: string = '../chain-registry';

const sql: PostgresInputBatch = EngineRegistry.getInstance().engine().input() as PostgresInputBatch;

export const getChainRegContents = () => {

  console.log("starting chain reg");

  const chainCollection =
    new CollectionNode(
      new DirectoryContentIncludesMatcher("chain.json"),
      [
        //chainFileScope // add the chain file as a child
      ],
      "chainDirectory",
      "chainDirectoryName",
      "chainDirectory",
      ["networkKind", "networkType"]
    );

  const cosmosScope =
    new ScopeNode(
      new AnyDirectoryMatcher(),
      TraversalMode.Self,
      [
        chainCollection
      ],
      "networkType",
      "networkType",
      () => "Cosmos",
      "networkTypeDirectory",
      ["networkKind"]
    );

  const nonCosmosScope =
    new ScopeNode(
      new DirectoryNameMatcher("_non-cosmos"),
      TraversalMode.Children,
      [
        chainCollection
      ],
      "networkType",
      "networkType",
      () => "Non-cosmos",
      "networkTypeDirectory",
      ["networkKind"]
    );

  const mainnetScope =
    new ScopeNode(
      new AnyDirectoryMatcher(),
      TraversalMode.Self,
      [
        cosmosScope,
        nonCosmosScope,
      ],
      "networkKind",
      "networkKind",
      () => "Mainnet",
      "networkDirectory",
      []
    );

  const testnetScope =
    new ScopeNode(
      new DirectoryNameMatcher("testnets"),
      TraversalMode.Children,
      [
        cosmosScope,
        nonCosmosScope,
      ],
      "networkKind",
      "networkKind",
      () => "Testnet",
      "networkDirectory",
      []
    );

  const registry =
    new ScopeNode(
      new AnyDirectoryMatcher(),
      TraversalMode.Self,
      [
        mainnetScope,
        testnetScope
      ],
    );

  const registryRootDirectory = new Directory("./temp");
  //const registryRootDirectory = new Directory(CCR1_PATH);

  const discoveries =
    registry.discover(
      new DiscoveryContext(
        registryRootDirectory
      )
    );

  console.log("discoveries");
  console.log(discoveries);

  const feeTokenImportMapping = 
    new ImportMapping(
      "FeeTokens",
      JsonPath.parse("fees.fee_tokens"),
      "ChainJsonFile.FeeTokens.",
    );

  const stakingTokenImportMapping = 
    new ImportMapping(
      "StakingTokens",
      JsonPath.parse("staking.staking_tokens"),
      "ChainJsonFile.StakingTokens.",
    );
    
  const logoUrisImportMapping = 
    new ImportMapping(
      "LogoURIs",
      JsonPath.parse("logo_URIs"),
      "",
    );

  const chainFileImportMapping = new ImportMapping(
    "Chains",
    new IdentitySourceResolver(),
    "ChainJsonFile.",
    [
      new DerivedField(
        "displayName",
        new LambdaValueResolver(source =>
          `${(source as any).pretty_name} (${(source as any).chain_id})`
        )
      )
    ],
    [],
    [
      feeTokenImportMapping,
      stakingTokenImportMapping,
      //logoUrisImportMapping
    ]
  );

  const chainFileImporter =
    new FileImportNode(
      "chainDirectory",
      new FileNameMatcher("chain.json"),
      new JsonFileReader(),
      chainFileImportMapping,
      "chainDirectory"
    );

  

  const assetsImportMapping = 
    new ImportMapping(
      "Assets",
      JsonPath.parse("assets"),
      "AssetlistJsonFile.Assets.",
      [],
      [
        new DerivedField(
          "assetDenom",
          new JsonValueResolver(
            JsonPath.parse("base")
          )
        )
      ],
      [
        logoUrisImportMapping
      ],
    );

  const assetlistFileImportMapping = new ImportMapping(
    "Chains",
    new IdentitySourceResolver(),
    "AssetJsonFile.",
    [],
    [],
    [
      assetsImportMapping,
    ]
  );

  const assetlistFileImporter =
    new FileImportNode(
      "chainDirectory",
      new FileNameMatcher("assetlist.json"),
      new JsonFileReader(),
      assetlistFileImportMapping,
      "chainDirectory"
    );

  const importers: ImportNode[] = [
    chainFileImporter,
    assetlistFileImporter,
    //versionsFileImporter,
    //...images maybe?
  ];

  const imports: ImportResult[] = [];

  for (const discovery of discoveries) {
    for (const importer of importers) {
      if (!importer.accepts(discovery)) {
        continue;
      }
      imports.push(
        ...importer.import(discovery)
      );
    }
  }

  console.log("imports");
  console.log(imports);

  const builder = new SchemaBuilder();

  for (const result of imports) {
    builder.observe(result);
    console.log(result);
  }

  console.log(builder.schema);

  const schema = builder.schema;

  // const databaseBuilder = new DatabaseBuilder();

  // const database =
  //   databaseBuilder.build(
  //     schema,
  //     imports
  //   );

  // console.log(database);

  console.log("created chain reg");

  const chain_reg = new RegistryRoot(CosmosChainRegistry, "Cosmos", CCR1_PATH);
  console.log("started");

  let registryRootReturn = sql.select("*").from("RegistryRoot").execute();
  console.log("Registry Root Select:");
  //console.log(registryRootReturn);

  console.log("here is the chain_regk");
  const obj = chain_reg.pointer?.parent?.object as MultiRegistryRoot;
  console.log("here's obj");
  //console.log(obj);
  console.log("and now");
  //console.log(obj?.get("RegistryRoot", "Cosmos"));
  //console.log(chain_reg);
  console.log("there was the chain_reg");
  

  const chain = chain_reg.get("Chain", "osmosis");
  console.log("chain");
  console.log(chain)
  if (chain) {
    console.log("Pretty Name");
    console.log(chain.property("pretty_name")); // Osmosis
    console.log("That was the pretty_name--should be Osmosis");


    console.log(chain.property("blah")); // undefined
    console.log("That was the blah--should be undefined");
    console.log("Assets:");
    const asset = chain.get("Asset", "uosmo");
    console.log(asset);
    console.log("That was the asset by looking from the chain level");
    const asset2 = chain_reg.get("Asset", "uosmo");
    console.log(asset2);
    console.log("That was the asset by looking from the chain_reg level--should be undefined");

    console.log(chain.get("Asset", "uosmo")?.property("name"));
    console.log("That was uosmo name, should be 'Osmosis'");

    console.log(chain_reg.get("Chain", "osmosis")?.get("Asset", "uosmo")?.property("name"));
    console.log("That was uosmo name, should be 'Osmosis'");

    console.log("Versions:");
    console.log(chain_reg.get("Chain", "osmosis")?.get("Version", "v28")?.property("recommended_version"));

    console.log(chain_reg.get("Chain", "cosmoshub")?.get("Asset", "uatom")?.property("description"));

    console.log("Last Trace:");
    console.log(chain_reg.get("Chain", "osmosis")?.
      get("Asset", "ibc/F6B691D5F7126579DDC87357B09D653B47FDCE0A3383FF33C8D8B544FE29A8A6")?.
      get("Trace", 0)
    );
    console.log("Traces:");
    const traces = chain_reg.get("Chain", "osmosis")?.
      get("Asset", "ibc/F6B691D5F7126579DDC87357B09D653B47FDCE0A3383FF33C8D8B544FE29A8A6")?.
      property("traces");
    console.log("Traces:");
    console.log(traces);
    console.log(traces[0].property("counterparty"));


    console.log("Decimals:");
    console.log(chain_reg.
      get("Chain", "cosmoshub")?.
      get("Asset", "uatom")?.
      property("decimals")
    );



    //console.log(chain_reg.chain("cosmoshub")?.asset("uatom")?.property("decimals"));
    console.log("Atom:");
    console.log(chain_reg.
      get("Chain", "osmosis")?.
      get("Asset", "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2")?.
      property("extended_description")
    );
    console.log("reference osmosis' ATOM, but inheriting the ext_desc");

    ///uncomment when ready

    console.log(chain_reg.
      get("Chain", "osmosis")?.
      get("Asset", "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2")?.
      property("extended_description", false)
    );
    console.log("reference osmosis' ATOM, without inheriting--should be undefined");

    /*console.log("Traces:");
    console.log(traces);*/
    /*console.log("USDC");
    console.log(arrayToJson(
      chain_reg.
      get("Chain", "osmosis")?.
      get("Asset", "ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858")?.
      property(Asset.PropertyName.TRACES)
    ));*/


    console.log(chain_reg.
      get("Chain", "osmosis")?.
      get("Asset", "ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858")?.
      toJSON()
    );
    console.log("That was the JSON");

    /*const multiTrace = chain_reg.
      get("Chain", "osmosis")?.
      get("Asset", "ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858")?.
      property("traces");
    console.log("multiTrace:");
    console.log(multiTrace);*/



    console.log(
      chain_reg.
        get("IbcConnection", "cosmoshub-osmosis")?.
        property("channels")
    );



    /*const filter2 = (chainPtr: Pointer) => chain_reg.get("Chain", chainPtr.key)
      ?.property(Chain.PropertyName.BECH32_PREFIX) === "osmo";
    chain_reg.find("Chain", [filter2])?.forEach((chainPtr) => {
      console.log(chainPtr);
    });*/

    const filter25 = (chainPointer: Pointer) => chainPointer.object
      ?.property("bech32_prefix") === "osmo";

    const results25: Pointer[] = chain_reg.find("Chain", [filter25]);
    results25.forEach((chainPointer: Pointer) => {
      console.log(chainPointer.key);
    });

    console.log("Done");

    /*const results26: Pointer[] = chain_reg.find("Chain");
    results26.forEach((chainPointer: Pointer) => {
      console.log(chainPointer.key);
    });

    console.log("Done2");*/




    //const filter3 = (asset: AssetPointer) => chain_reg.asset(asset)?.property("symbol") === "OSMO";
    const filter3 = (assetPointer: Pointer) =>
      assetPointer.object?.property("symbol") === "OSMO";
    //console.log(chain_reg.chain("kopi"));
    //console.log(chain_reg.chain("kopi")?.assets());
    //console.log(chain_reg.chain("kopi")?.assets([filter3]));

    //const filteredAssets: any[] = chain_reg.assets([filter3]);
    const filteredAssets: Pointer[] = chain_reg.find("Asset", [filter3]);
    //console.log(filteredAssets);

    filteredAssets?.forEach((assetPtr) => {
      //console.log(assetPtr.object?.property("base"));
      //console.log("any");
      console.log(assetPtr.key);
    });

    console.log("those were the assets");


    console.log("IBC Connections:");

    /*const filteredConnections45: any[] = chain_reg.find("IbcConnection", [()=>true]);
    filteredConnections45?.forEach((ptr) => {
      console.log(ptr.object?.property("chain_1"));
      console.log(ptr.object?.property("chain_2"));
    });*/


    const property = chain_reg.
      get("IbcConnection", "juno-osmosis")?.
      get("IbcChannel", 1)?.
      property("chain_1");
    console.log(property);



    /*console.log("IBC Channels:");
    const filter4 = (ptr: Pointer) => {
      const obj: RegistryObject | undefined = ptr.object;
      const isZero = (party: Pointer) => {
        return (
          party.object?.property("channel_id") === "channel-0" &&
          party.object?.property("port_id") === "transfer"
        );
      }
      return obj?.find("IbcChannelParty", [isZero]).length ? true : false;
    }
    const filteredChannels4: Pointer[] = chain_reg.find("IbcChannel", [filter4]);
    filteredChannels4?.forEach((ptr) => {
      //console.log(ptr.parent?.object?.property("chain_1"));
      //console.log(ptr.parent?.object?.property("chain_2"));
      console.log(ptr.object?.get("IbcChannelParty", 0)?.property("channel_id"));
      console.log(ptr.object?.get("IbcChannelParty", 1)?.property("channel_id"));
    });*/

    /*//Q: Which IBC files have multiple channels that are transfer/transfer?
    console.log("transfer/transfer IBC Files:");
    const filter12 = (ptr: Pointer) => {
      const obj: RegistryObject | undefined = ptr.object;
      const isTransferTransfer = (channel: Pointer) => {
        return (
          channel.object?.get("IbcChannelParty", 0)?.property("port_id") === "transfer" &&
          channel.object?.get("IbcChannelParty", 1)?.property("port_id") === "transfer"
        );
      }
      console.log((obj?.find("IbcChannel", [isTransferTransfer]).length || 0) >= 2);

      return (obj?.find("IbcChannel", [isTransferTransfer]).length || 0) >= 2 ? true : false;
    }
    const filteredChannels11: Pointer[] = chain_reg.find("IbcConnection", [filter12]);
    filteredChannels11?.forEach((ptr) => {
      console.log(ptr.object?.get("IbcConnectionParty", 0)?.property("chain_name"));
      console.log(ptr.object?.get("IbcConnectionParty", 1)?.property("chain_name"));
    });*/

    //Q: Which assets have a two denoms where they are are the same letters just with different letter casing?
    /*console.log("same denom unit:");
    const filter5 = (assetPointer: Pointer) => {
      const denom_units = assetPointer.object?.property("denom_units");
      for (let i = 0; i <= denom_units.length - 1; ++i) {
        for (let j = i; j <= denom_units.length - 1; ++j) {
          if (i === j) continue;
          if (denom_units[i].denom.toLowerCase() === denom_units[j].denom.toLowerCase()) {
            return true;
          }
        }
      }
      return false;
    }
    const filteredAssets5: any[] = chain_reg.find("Asset", [filter5]);

    filteredAssets5?.forEach((assetPtr) => {
      //console.log(assetPtr.parent?.object?.property("chain_name"));
      console.log(assetPtr.parent?.key);
      console.log(assetPtr.object?.property("base"));
    });*/

    /*console.log("same denom unit:");

    const filter6 = (denomUnitPtr: Pointer) => {
      const filter8 = (denomUnitPtr2: Pointer) => {
        return denomUnitPtr.key !== denomUnitPtr2.key &&
          denomUnitPtr.object?.property("denom")?.toLowerCase() === denomUnitPtr2.object?.property("denom")?.toLowerCase();
      }
      return denomUnitPtr.parent?.object?.find("Asset::denom_unitsElement", [filter8]).length ? true : false;
    }
    const filteredAssets6: any[] = chain_reg.find("Asset::denom_unitsElement", [filter6]);

    filteredAssets6?.forEach((denomUnitPtr) => {
      console.log(denomUnitPtr.parent?.parent?.key);
      console.log(denomUnitPtr.parent?.key);
      //console.log(denomUnitPtr.key);
    });*/


    /*//challenge for images
    //find all cases where the chain logo is defined in logo_URIs but not in the images array.
    console.log("Looking for all the chains where logoURIs exists but not Images");
    const chainsWithImageOnlyInLogoUris = (chainPtr: Pointer) => {
      return chainPtr.object?.property("logo_URIs") && !chainPtr.object?.get("ChainImage", 0);
    }
    const filteredChains = chain_reg.find("Chain", [chainsWithImageOnlyInLogoUris]);
    filteredChains.forEach((chain) => {
      console.log(chain.key);
    });*/

    console.log("Directories");

    console.log(chain_reg.get("Chain", "osmosis")?.get("Asset", "uosmo")?.property("denom_units"));
    console.log(
      chain_reg.get("Chain", "osmosis")?.
      find("Asset", [(ptr: Pointer) => ptr.object?.property("base") === "uosmo"])?.
      [0]?.object?.
      //find("Asset::denom_unitsElement", [(ptr: Pointer) => ptr.object?.property("base") === "uosmo"])?.
      property("denom_units")
    );
    console.log(chain_reg.get("Chain", "osmosis")?.get("Asset", "uosmo")?.get("Asset::denom_unitsElement", 1));

  }
  
};