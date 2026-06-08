import { type Action } from "../actions/Action.js";
import { UpdateRowAction } from "../actions/UpdateRowAction.js";
import { type UpdateSetStatement } from "../statements/index.js";
import { type ColumnId, type Column, type ColumnValue } from "../schema/Column.js";
//import { getOrderedColumns, resolveUniqueColumnList } from "./resolveColumnList.js";
import { type SemanticAnalyzer } from "./SemanticAnalyzer.js";
import { type ExplicitInput } from "../types/ExplicitInput.js";
import { normalizeIdentifier } from "../utils/normalizeIdentifier.js";
//import { type SemanticValue, toSemanticValues } from "./values.js";


// export interface UpdateSetStatement extends BaseStatement {
//   kind: "update_set",
//   table: string,
//   values: Record<string, ExplicitInput>,
//   where?: WhereClause,
//   returning?: string[],
// }

//Map<ColumnId, ExplicitInput>

export function bindUpdateSet(
  semantic: SemanticAnalyzer,
  stmt: UpdateSetStatement,
) {
  const stmtActions: Action[] = [];

  const database = semantic.ctx.requireDatabase();
  const dbName = database.name;

  const tableName: string = stmt.table;
  const table = database.requireTable(tableName);

  const columnIdToValueMap = new Map<ColumnId, ExplicitInput>();
  const valueRecord = stmt.values;
  for (const columnName in valueRecord) {
    const columnId = table.requireColumnIdByName(columnName);
    if (Object.prototype.hasOwnProperty.call(valueRecord, columnId)) {
      columnIdToValueMap.set(
        //table.requireColumnIdFromName(columnName),
        columnId,
        valueRecord[columnName]
      );
    }
  }

  //const allTableColumns = getOrderedColumns(table);

  // const tableColumnMap = new Map(
  //   allTableColumns.map(c => [c.name.toLowerCase(), c])
  // );

  // const inputColumns: string[] = [];
  // const inputValues: ColumnValue[] = [];
  // for(const {column, value} of stmt.values) {
  //   inputColumns.push(column);
  //   inputValues.push(value);
  // }

  // const semanticValues = toSemanticValues(inputValues, inputColumns, semantic.ctx.rules.values.keywords);

  // const updateColumns = resolveUniqueColumnList(
  //   allTableColumns,
  //   inputColumns
  // );

  // const resolvedValueMap: Map<number, ColumnValue> = resolveSemanticValues(
  //   semanticValues,
  //   updateColumns,
  //   tableColumnMap,
  // );

  //need to get rows that meet criteria (the where clause), and return qualifying rows as rowNums
  let rowNums: number[] = [];

  //rowNums = identifyAffectedRows(stmt.where) // TODO write this fn
  //or should it return an array of complete rows?

  if (!rowNums || !rowNums.length) return [];

  for (const rowNum of rowNums) {
    stmtActions.push(new UpdateRowAction(
      dbName,
      tableName,
      rowNum,
      columnIdToValueMap,
    ));
  }

  return stmtActions;
}

// function assertRowLengthMatchesColumnLength(row: ColumnValue[], columns: string[]): void {
//   if (row.length !== columns.length) {
//     throw new Error(`Row length and Column length mismatch`);
//   }
// }

// function resolveSemanticValues(
//   semanticValues: SemanticValue[],
//   updateColumns: string[],
//   tableColumns: Map<string, Column>,
// ): Map<number, ColumnValue> {
//   const result = new Map<number, ColumnValue>();

//   if (semanticValues.length !== updateColumns.length) {
//     throw new Error("Column/value length mismatch");
//   }

//   for (let i = 0; i < semanticValues.length; i++) {
//     const colName = updateColumns[i];

//     const column = tableColumns.get(colName);
//     if (column === undefined) {
//       throw new Error(`Specified Update Column not among Table Columns`);
//     }

//     const columnIndex = column.position;
//     if (columnIndex === undefined) {
//       throw new Error(`Update Column not found among Columm Indices`);
//     }

//     const semanticValue = semanticValues[i];

//     let resolved: ColumnValue;

//     switch (semanticValue.kind) {
//       case "default":
//         if (column.defaultValue === undefined) {
//           throw new Error(`No default for column ${colName}`);
//         }
//         resolved = column.defaultValue; // for this resolution
//         break;

//       case "null":
//         resolved = null;
//         break;

//       case "value":
//         resolved = semanticValue.value;
//         break;

//       default:
//         throw new Error(`Invalid SemanticValue kind`);
//     }

//     result.set(columnIndex, resolved);
//   }

//   return result;
// }