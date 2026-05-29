import FsStructureEntry from '../mapping/FsStructureEntry.js';
import Directory from '../mapping/Directory.js';
import File from '../mapping/File.js';
import Pointer from '../mapping/Pointer.js';
import { EngineRegistry } from '../engine/EngineRegistry.js';
import { Dialect } from "../dialect/Dialect.js";
import { type PostgresInputBatch } from '../input/PostgresInputBatch.js';


EngineRegistry.getInstance().newEngine("DEFAULT_POSTGRES", Dialect.Postgres);
EngineRegistry.getInstance().setDefaultEngine("DEFAULT_POSTGRES");
const sql: PostgresInputBatch = EngineRegistry.getInstance().engine().input() as PostgresInputBatch;

sql.createDatabase("Cosmos Chain Registry").execute();
console.log("Created CCR");

sql.useDatabase("Cosmos Chain Registry").execute();
console.log("Set current database");

sql.begin().execute();
console.log("Begin");

sql.createTable("RegistryRoot", {
  name: { type: String, nullable: true }
}).execute();
console.log("Created Table");

sql.commit().execute();
console.log("Commit");

const chainRegistryRoot = new FsStructureEntry(
  "ChainRegistryRoot",
  Directory,
  null,
  null,
  () => "."
);

console.log("Adding Columns");
sql
  .alterTable("RegistryRoot")
  .add("newCol1", { type: Number, defaultValue: 69 })
  .execute();

console.log("Adding More Columns");
sql
  .alterTable("RegistryRoot")
  .add("newCol2", { type: Number, defaultValue: 420 })
  .execute();

console.log("Inserting a record into RegistryRoot");
sql.
  insertInto("RegistryRoot", ["name"])?.
  values([["Cosmos Chain Registry"]]).execute();
console.log("Inserted");

const table = EngineRegistry.getInstance().engine().databases
  .require("Cosmos Chain Registry")
  .requireTable("RegistryRoot");
console.log("Set table");
//console.log(table);

console.log("trying to create Table");
//-------------------DELETE this------------------
 const table1 = new Table("Node")
      .addColumn({ name: "ID", type: Number })
      .addColumn({
        name: "RefID",
        type: Number,
        nullable: true,
      })
      .createIndex({
        name: "PK_NODE",
        columns: ["ID"],
        unique: true,
      })
      .addRow([1, 2])
      .addRow([2, 1]);

    const db = new Database("DB1")
      .addTable(table1)
      .createForeignKey(
        "Node",
        {
          name: "FK_NODE_REF",
          columns: ["RefID"],
          parentTable: "Node",
          parentColumns: ["ID"],
          onDelete: ReferentialAction.cascade,
          onUpdate: ReferentialAction.cascade,
        }
      );

    const updates = [3, 2];

    const updated = db.updateRow(
      "Node",
      0,
      updates,
    );

    console.log("THe row is:");
    console.log(updated.requireTable("Node").requireRow(1));

      console.log("-----It worked!-----");

    //expect(updated.requireTable("A").rowAlive[0]).toBe(false);
    //expect(updated.requireTable("B").rowAlive[0]).toBe(false);
    //___________________________________


const predicate = new ComparisonPredicate(
  /* columnIndex */ 0,
  "eq",
  "Cosmos Chain Registry"
);

const predicate2 = new ComparisonPredicate(
  /* columnIndex */ 2,
  "gt",
  100
);
const p3 = new BinaryLogicalPredicate(
  predicate,
  predicate2,
  "and"
);

console.log("Set Predicate");
const fnode = new FilterNode(
  p3,
  new TableScanNode(table)
);
console.log("set Filter");

const projNode = new ProjectNode(
  [0, 2], // selected columns
  fnode
);

const plan = { root: projNode };
console.log([...plan.root.execute()]);

console.log("Results:");
const results = [...projNode.execute()];
console.log(results);
console.log("End of results");


console.log("attempting Select");
let select = sql.select("*").from("RegistryRoot").execute();
console.log("Displaying RegistryRoot");
console.log(select[0]);

sql.begin().execute();
sql.createTable("NetworkKind", {
  name: { type: String },
  directoryName: { type: String }
}).execute();
console.log("added network kind table");
sql.
  insertInto("NetworkKind", ["name", "directoryName"])?.
  values([["mainnet", "."]]).execute();
console.log("inserted one row into network kind table");
sql.
  insertInto("NetworkKind", ["name", "directoryName"])?.
  values([["testnet", "testnets"]]).execute();
console.log("inserted a second row into network kind table");
sql.commit().execute();
//add DirectoryContent as a type? or find some way to indicate that a field corresponds to a Directory??

const networkTypeDirectory = new FsStructureEntry(
  "NetworkTypeDirectory",
  Directory,
  chainRegistryRoot,
  ["mainnet", "testnet"],
  (type) => type === "mainnet" ? "." : "testnets"
);
//chainRegistryFs.add(networkTypeDirectory);

sql.createTable("ChainTypeDirectory", {
  name: { type: String },
  directoryName: { type: String }
});

const chainTypeDirectory = new FsStructureEntry(
  "ChainTypeDirectory",
  Directory,
  networkTypeDirectory,
  ["cosmos", "non-cosmos"],
  (type) => type === "cosmos" ? "." : "_non-cosmos"
);
//networkTypeDirectory.add(chainTypeDirectory);

sql.
  insertInto("ChainTypeDirectory", ["name", "directoryName"])?.
  values([["cosmos", "."]]);
sql.
  insertInto("ChainTypeDirectory", ["name", "directoryName"])?.
  values([["non-cosmos", "_non-cosmos"]]);

sql.createTable("ConceptStructure", {
  id: { type: String, primaryKey: true },
  parentId: { type: String },

  //key: { type: "function", defaultValue: { f: () => {} } },
  //qualifyFn: { type: "function", defaultValue: { f: () => true }}
});

sql.
  insertInto("ConceptStructure", ["id", "parentId"]).
  values([["RegistryRoot", null]]);
sql.
  insertInto("ConceptStructure", ["id", "parentId"]).
  values([["Chain", "RegistryRoot"]]);
sql.
  insertInto("ConceptStructure", ["id", "parentId"]).
  values([["Asset", "Chain"]]);

sql.createTable("StorageBinding", {
  id: { type: String, primaryKey: true },
  parentId: { type: String }, // FK -> StorageBinding
  structureId: { type: String }, // FK -> ConceptStructure
  storageType: { type: String, enumValues: ["Fs.Directory", "Fs.File", "Json", "Db.Table"] },
  name: { type: "function" },
  keys: { type: "function" }, // or types
  qualifyFn: { type: "function", defaultValue: "{ f: () => true }"}
});

sql.
  alterTable("StorageBinding").
    addConstraint("FK_ConceptStructure").
      foreignKey(["structureId"]).
       references("ConceptStructure", ["id"]);//.
    // addConstraint("FK_StorageBindingParent").
    //   foreignKey(["parentId"]).
    //   references("StorageBinding", ["id"]);
// sql.
//   insertInto("StorageBinding", ["id", "structureId", "storageType", "name"]).
//   values([["RegistryRootDirectory", "RegistryRoot", "Fs.Directory", { f: () => "chain_registry" } ]]);
// sql.
//   insertInto("StorageBinding", ["id", "parentId", "storageType", "name", "keys"]).
//   values([["NetworkTypeDirectory", "RegistryRootDirectory", "Fs.Directory",
//     { f: (networkType: string) => networkType === "mainnet" ? "." : "testnets" },
//     { f: () => ["mainnet", "testnet"] }
//   ]]);
// sql.
//   insertInto("StorageBinding", ["id", "structureId", "storageType", "name"]).
//   values([["ChainDirectory", "Chain", "Fs.Directory", { f: (chainName: string) => chainName } ]]);
// sql.
//   insertInto("StorageBinding", ["id", "structureId", "storageType", "name"]).
//   values([["ChainFile", "Chain", "Fs.File", { f: () => "chain.json" } ]]);
// sql.
//   insertInto("StorageBinding", ["id", "structureId", "storageType"]).
//   values([["AssetlistFile", "Chain", "Fs.File", { f: () => "assetlist.json" }]]);
// sql.
//   insertInto("StorageBinding", ["id", "structureId", "storageType"]).
//   values([["VersionsFile", "Chain", "Fs.File", { f: () => "versions.json" }]]);


sql.
  insertInto("Structure", ["level", "parentLevel", "dataType"])?.
  values([["RegistryRoot", "Fs.Directory", "RegistryRoot"]]);
// sql.
//   insertInto("Structure", ["level", "dataType", "parentLevel", "name"])?.
//   values([[
//     "NetworkKind",
//     "Fs.Directory",
//     "RegistryRoot",
//     // {
//     //   kind: "map",
//     //   cases: {
//     //     mainnet: "",
//     //     testnet: "testnets",
//     //     devnet: "testnets "
//     //   },
//     //   default: ""
//     // },
//     { f: (networkKind: string) => networkKind === "mainnet" ? "." : "testnets" },
//   ]]);
// sql.
//   insertInto("Structure", ["level", "dataType", "parentLevel", "name"])?.
//   values([[
//     "ChainType",
//     "Fs.Directory",
//     "NetworkKind",
//     // {
//     //   kind: "map",
//     //   cases: {
//     //     cosmos: "."
//     //   },
//     //   default: "_non-cosmos"
//     // }
//     { f: (chainType: string) => chainType === "cosmos" ? "." : "_non-cosmos" },
//   ]]);
// sql.
//   insertInto("Structure", ["level", "dataType", "parentLevel", "name", "qualifyFn"])?.
//   values([[
//     "ChainDirectory",
//     "Fs.Directory",
//     "ChainType",
//     { kind: "identity" },
//     //{ fn: (chainName: string) => chainName },
//     { f: (fsItem: DirectoryContent): boolean => {
//       if (!(fsItem instanceof Directory)) return false;
//       return ["assetlist.json", "chain.json"]
//         .some(name => fsItem.find(File, name).length > 0);
//       }
//     }
//   ]]);
// sql.
//   insertInto("Structure", ["level", "dataType", "parentLevel", "name"])?.
//   values([[
//     "ChainFile",
//     "Fs.File",
//     "ChainDirectory",
//     { kind: "const", value: "chain.json" }
//     //{ fn: () => "chain.json" }
//   ]]);
// sql.
//   insertInto("Structure", ["level", "dataType", "parentLevel", "name"])?.
//   values([[
//     "AssetlistFile",
//     "Fs.File",
//     "ChainDirectory",
//     { kind: "const", value: "assetlist.json" }
//     //{ fn: () => "assetlist.json" }
//   ]]);
// sql.
//   insertInto("Structure", ["level", "dataType", "parentLevel", "name"])?.
//   values([[
//     "VersionsFile",
//     "Fs.File",
//     "ChainDirectory",
//     { kind: "const", value: "versions.json" }
//     //{ fn: () => "assetlist.json" }
//   ]]);

const chainDirectory = new FsStructureEntry(
  "ChainDirectory",
  Directory,
  chainTypeDirectory,
  null,
  (key) => key as string,
  (item: DirectoryContent): boolean => {
    if (!(item instanceof Directory)) return false;
    return ["assetlist.json", "chain.json"]
      .some(name => item.find(File, name).length > 0);
  },
);
//chainTypeDirectory.add(chainDirectory);

const assetlistFile = new FsStructureEntry(
  "assetlistFile",
  File,
  chainDirectory,
  null,
  () => "assetlist.json"
);
//chainDirectory.add(assetlistFile);

const chainFile = new FsStructureEntry(
  "chainFile",
  File,
  chainDirectory,
  null,
  () => "chain.json"
);
//chainDirectory.add(chainFile);

const versionsFile = new FsStructureEntry(
  "chainFile",
  File,
  chainDirectory,
  null,
  () => "versions.json"
);
//chainDirectory.add(versionsFile);

const imagesDirectory = new FsStructureEntry(
  "ImagesDirectory",
  Directory,
  chainDirectory,
  null,
  () => "images"
);
//chainDirectory.add(imagesDirectory);

const imageFile = new FsStructureEntry(
  "imageFile",
  File,
  imagesDirectory,
  null,
  (name) => name as string,
);
//imagesDirectory.add(imageFile);

const ibcDirectory = new FsStructureEntry(
  "IbcDirectory",
  Directory,
  networkTypeDirectory,
  null,
  () => "_IBC"
);

const ibcFile = new FsStructureEntry(
  "IbcFile",
  File,
  ibcDirectory,
  null,
  (key) => key as string & ".json",
  (item: DirectoryContent): boolean => item instanceof File && item.basename.includes(".json")
);

function isChainDirectory(directory: Directory | File): boolean {
  if (directory instanceof File) return false;
  const assetlistFileExists = directory.find(File, assetlistFile.name()) ? true : false;
  const chainFileExists = directory.find(File, chainFile.name()) ? true : false;
  return assetlistFileExists || chainFileExists;
}


import RegistryObject from '../mapping/RegistryObject.js';
import RegistryStructureEntry from '../mapping/RegistryStructureEntry.js';
import DirectoryContent from '../mapping/DirectoryContent.js';
import { InputBatch } from '../input/InputBatch.js';
import { SemanticAnalyzer } from '../semantic/SemanticAnalyzer.js';
import { Engine } from '../engine/Engine.js';
import { ComparisonPredicate } from '../query/predicate/ComparisonPredicate.js';
import { FilterNode } from '../query/plan/FilterNode.js';
import { TableScanNode } from '../query/plan/TableScanNode.js';
import { ProjectNode } from '../query/plan/ProjectNode.js';
import { BinaryLogicalPredicate } from '../query/predicate/LogicalPredicate.js';
import { Table } from '../schema/Table.js';
import { Database } from '../schema/Database.js';
import { ReferentialAction } from '../schema/ReferentialAction.js';

export const CosmosChainRegistry = new Map();

const chainRegistry = new RegistryStructureEntry(
  "RegistryRoot",
  "",
  null,
  (parent: RegistryObject): Directory[] => [parent.pointer.root.object.directory],
  () => "Cosmos",
  () => null
);
CosmosChainRegistry.set("RegistryRoot", chainRegistry);

const chain = new RegistryStructureEntry(
  "Chain",
  "",
  "RegistryRoot",
  (parent: RegistryObject): Directory[] => chainDirectory.find(parent.pointer.root.object, Directory),
  (element: Directory) => element.basename,
  (element: Directory) => element.find(File, chainFile.name()).at(0)?.contents
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
    chainDirectory.find(parent.pointer.root.object, Directory, parent.pointer.key as string)[0]?.find(File, assetlistFile.name()).at(0)?.contents.assets,
  (element: any): string => element.base,
  (element: any): any => element,
  assetOverrideProperties,
  assetDerivedProperties,
  assetArgsProperty,
  assetDefaultArgs
);
CosmosChainRegistry.set("Asset", asset);

// const denomUnit = new RegistryStructureEntry(
//   "DenomUnit",
//   0,
//   "Asset",
//   (parent: RegistryObject): any[] => {
//     return parent.property("denom_units", false) || [];
//   },
//   null,
//   (element: any): any => element
// );
// CosmosChainRegistry.set("DenomUnit", denomUnit);

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
  (parent: RegistryObject): any[] => chainDirectory.find(parent.pointer.root.object, Directory, parent.pointer.key as string)[0]
    ?.find(File, versionsFile.name()).at(0)?.contents.versions,
  (element: any): string => element.name,
  (element: any): any => element
);
CosmosChainRegistry.set("Version", version);

const ibcConnection = new RegistryStructureEntry(
  "IbcConnection",
  "",
  "RegistryRoot",
  (parent: RegistryObject): any[] => ibcFile.find(parent.pointer.root.object, File),
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
