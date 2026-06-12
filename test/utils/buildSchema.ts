import { Table, type TableId } from "../../src/schema/Table.js";
import { Database } from "../../src/schema/Database.js";
import { type ColumnSpec, type ColumnId } from "../../src/schema/Column.js";
import { type ForeignKeyId } from "../../src/schema/ForeignKey.js";
import { type IndexSpec, type IndexId } from "../../src/schema/Index.js";
import { type IdService } from "../../src/types/IdAllocator.js";
import { type CheckSpec, ForeignKeySpec } from "../../src/schema/Constraint.js";

let nextId = 1;

export function createTestIdService(): IdService {

  return {
    nextTableId: () => nextId++ as TableId,
    nextColumnId: () => nextId++ as ColumnId,
    nextIndexId: () => nextId++ as IndexId,
    nextForeignKeyId: () => nextId++ as ForeignKeyId,
  };
}

// export function makeResolvedForeignKey(overrides = {}): ForeignKey {
//   const ids = createTestIdService();

//   return {
//     id: ids.nextForeignKeyId(),
//     name: "FK_Test",
//     columns: [ids.nextColumnId()],
//     parentTable: "Parent",
//     parentColumns: [ids.nextColumnId()],
//     reverseIndex: ids.nextIndexId(),
//     ...overrides,
//   } as ForeignKey;
// }

export function createColumnTestSpec(
  overrides: Partial<ColumnSpec> = {},
): ColumnSpec {
  return {
    name: "c1",
    type: Number,
    nullable: true,
    ...overrides,
  };
}

export function createIndexTestSpec(
  overrides: Partial<IndexSpec> = {},
): IndexSpec {
  return {
    name: "i1",
    columns: ["c1"],
    unique: false,
    ...overrides,
  };
}

export function createCheckTestSpec(
  overrides: Partial<CheckSpec> = {},
): Omit<CheckSpec, "kind"> {
  return {
    name: "chk1",
    columns: ["c1"],
    expression: undefined,
    ...overrides,
  };
}

export function createForeignKeyTestSpec_Table(
  overrides: Partial<{
    name: string,
    columns: ColumnId[],
    reverseIndex: IndexId,
    parentTable: TableId,
    parentColumns: ColumnId[],
    parentIndex: IndexId,
  }> = {},
): {
  name: string,
  columns: ColumnId[],
  reverseIndex: IndexId,
  parentTable: TableId,
  parentColumns: ColumnId[],
  parentIndex: IndexId,
} {
  const ids = createTestIdService();
  return {
    name: "fk1",
    columns: [ids.nextColumnId()],
    reverseIndex: ids.nextIndexId(),
    parentTable: ids.nextTableId(),
    parentColumns: [ids.nextColumnId()],
    parentIndex: ids.nextIndexId(),
    ...overrides,
  };
}

export function createForeignKeyTestSpec_Database(
  overrides: Partial<ForeignKeySpec & {
    reverseIndex: string,
  }> = {},
): Omit<ForeignKeySpec, "kind"> & {
  reverseIndex: string,
} {
  return {
    name: "fk1",
    columns: ["c1"],
    parentTable: "t1",
    parentColumns: ["c1"],
    reverseIndex: "i1",
    ...overrides,
  };
}

export function addForeignKeyByName(
  table: Table,
  spec: {
    name: string;
    columns: string[];
    reverseIndex?: string;
  }
): Table {
  return table.createForeignKey(
    createForeignKeyTestSpec_Table({
      name: spec.name,
      columns: spec.columns.map(c =>
        table.columns.requireIdByName(c)
      ),
      reverseIndex: spec.reverseIndex
      ? table.indexes.requireIdByName(spec.reverseIndex)
      : undefined,
    })
  );
}

interface DefaultBuildOptions {
  ids?: IdService;
  name?: string;
}

interface BuildTableOptions {
  ids?: IdService;
  name?: string;
  columns?: number | string[];
  indexes?: Array<{
    name?: string;
    columns?: string[];
  }>;
  foreignKeys?: Array<{
    name?: string;
    columns?: string[];
    //reverseIndex?: string
  }>;
}

export function buildTable(
  options: BuildTableOptions = {},
): Table {
  const {
    name = "t1",
    columns = [],
    //index = [],
    foreignKeys = [],
  } = options;

  const ids = createTestIdService();

  const tableId = ids.nextTableId();

  let table = Table.create({id: tableId, name});

  const columnNames =
    typeof columns === "number"
      ? Array.from(
          { length: columns },
          (_, i) => `c${i + 1}`,
        )
      : columns;

  for (const columnName of columnNames) {
    table = table.createColumn({
      name: columnName,
      type: Number,
    });
  }

  foreignKeys.forEach((fk, i) => {
    const name = fk.name ?? `fk${i + 1}`;

    const fkColumns =
      fk.columns?.length
        ? fk.columns
        : [columnNames[0]];

    table = table.createForeignKey(
      createForeignKeyTestSpec_Table({
        name,
        columns: fkColumns.map(c =>
          table.columns.requireIdByName(c)
        ),
      })
    );
  });

  return table;
}

// type TableHandle = {
//   table: Table;
//   cols: Record<string, ColumnId>;
// };

// type ColumnHandles = Record<string, ColumnId>;

// export function getColumnHandles(table: Table): ColumnHandles {
//   const result: ColumnHandles = {};

//   for (const col of table.columns.values()) {
//     result[col.name] = col.id;
//   }

//   return result;
// }

// export function buildTableWithHandles(
//   spec: {
//     name?: string;
//     columns: string[];
//   },
//   ids: IdService = createTestIdService(),
// ): TableHandle {
//   const table = new Table(spec.name ?? "T1");

//   const cols: Record<string, ColumnId> = {};

//   for (const name of spec.columns) {
//     const id = ids.nextColumnId();

//     table.createColumn({
//       name,
//       type: Number,
//       nullable: true,
//     });

//     cols[name] = id;
//   }

//   return { table, cols };
// }

interface BuildDatabaseOptions {
  ids?: IdService;
  name?: string;
  tables?: number | string[];
}

export function buildDatabase(
  options: BuildDatabaseOptions = {},
): Database {
  const {
    ids = createTestIdService(),
    name = "db1",
    tables = ["t1"],
  } = options;

  const tableNames =
    typeof tables === "number"
      ? Array.from(
          { length: tables },
          (_, i) => `t${i + 1}`,
        )
      : tables;

  let database = new Database(name);

  for (const tableName of tableNames) {
    database = database.addTable(buildTable({
      ids,
      name: tableName,
    }));
  }

  return database;
}

export function buildCompositeKeyDatabase(
  options: DefaultBuildOptions = {},
): Database {
  const {
    ids = createTestIdService(),
    name = "db1",
  } = options;

  return new Database(name)
    .addTable(
      buildTable({ids, name: "parent", columns: ["c1", "c2"]})
        .createIndex({
          name: "A_B",
          columns: ["c1", "c2"],
          unique: true,
        })
    )
    .addTable(
      buildTable({ids, name: "child", columns: ["c1", "c2"]})
        .createIndex({
          name: "A_B",
          columns: ["c1", "c2"],
          unique: true,
        })
    )
    .createForeignKey("child", {
      name: "fk",
      columns: ["c1", "c2"],
      reverseIndex: "A_B",
      parentTable: "parent",
      parentColumns: ["c1", "c2"],
    });
}

export function buildParentChildDatabase(
  options: DefaultBuildOptions = {},
): Database {
  const {
    ids = createTestIdService(),
    name = "db1",
  } = options;

  return new Database(name)
    .addTable(
      buildTable({ids, name: "parent", columns: ["id"]})
        .createIndex({
          name: "i1",
          columns: ["id"],
          unique: true,
        })
    )
    .addTable(
      buildTable({ids, name: "child", columns: ["ref"]})
        .createIndex({
          name: "ri1",
          columns: ["ref"],
          unique: false,
        })
    )
    .createForeignKey("child", createForeignKeyTestSpec_Database({
      name: "fk1",
      columns: ["ref"],
      reverseIndex: "ri1",
      parentTable: "parent",
      parentColumns: ["id"],
    }));
}