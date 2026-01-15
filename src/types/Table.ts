import {
  type Column,
  type ColumnValue,
  type ColumnType,
  widens,
  widenValue,
  canBeIndexed,
  resolveDefault,
} from "./Column.js";
import {
  CONSTRAINT_KIND,
  type ConstraintSpec,
  type PrimaryKey,
  type Unique,
  type DropConstraintSpec,
  type Constraint,
} from "./Constraint.js";
import { Constraints } from "./Constraints.js";
import type { RowId } from "../types/RowId.js";
import { ID } from "../constants.js";
import Expression from "../types/Expression.js";
import type { InsertRow, InsertCell, InsertValue } from "../engine/InsertModel.js";

type HashIndex = Map<ColumnValue, RowId[]>;
type SortIndex = Map<ColumnValue, RowId[]>;

type InsertPlan = {
  rowValues: Map<string, ColumnValue>;
  autoIncrementColumns: string[];
  uniqueKeys: Map<string, string>; // constraintName → key
};

function equalArrays(array1: any[], array2: any[]) {
  return (array1.length == array2.length) && array1.every(function(element, index) {
    return element === array2[index]; 
  });
}

function isExpression(input: any): input is Expression {
  return (
    typeof input === "object" &&
    input !== null &&
    typeof input.kind === "string" &&
    (input.kind === "const" ||
     input.kind === "identity" ||
     input.kind === "map")
  );
}

export function evaluate(input: ColumnValue, context?: ColumnValue): ColumnValue | undefined {
  if (input === undefined) return undefined;

  // Already a concrete value
  if (
    typeof input === "string" ||
    typeof input === "number" ||
    typeof input === "boolean" ||
    input === null
  ) {
    return input;
  }

  // Expression
  if (isExpression(input)) {
    switch (input.kind) {
      case "const":
        return input.value;

      case "identity":
        return context;

      case "map":
        if (context === undefined || context === null) return input.default ?? null;
        return input.cases[String(context)] ?? input.default ?? null;
    }
  }

  throw new Error("Invalid value passed to evaluate()");
}

export class Table {

  // static    rowIdColumnSpec: InlineColumnSpec       = {
  //   type: Number,
  //   nullable: false,
  //   unique: true,
  //   primaryKey: true,
  //   autoIncrement: {
  //     next: 1,
  //     step: 1
  //   },
  // };

  public    cols                              = new Map<string, Column>();
  public    data                              = new Map<string, ColumnValue[]>();
  protected rowAlive:   boolean[]             = [];
  public    numRows:    number                = 0;

  //constraints
  //public    primaryKey:  string[]             = [];
  // public    primaryKey: string | undefined    = undefined;
  // public    foreignKeys                       = new Map<string, ForeignKey>();
  // public    unique                            = new Map<string, Unique>();
  // public    check                             = new Map<string, Check>();

  private constraints = new Constraints();
  
  //not sure that these should go here
  public    hashIdxs                        = new Map<string, HashIndex>();
  public    sortIdxs                        = new Map<string, SortIndex>();

  constructor(
    public name: string,
    public dbName?: string
  ) {}

  // static createTable(
  //   dbName: string | undefined,
  //   table: string,
  //   columnSchema: Record<string, ColumnSpec>,
  //   constraintSchema?: Record<string, ConstraintSpec>
  // ): Table {
  //   const t = new Table(table);

  //   for (const [colName, spec] of Object.entries(columnSchema)) {
  //     // Add column first
  //     t.addColumn(colName, {
  //       type: spec.type,
  //       nullable: spec.nullable ?? true,
  //       autoIncrement: spec.autoIncrement,
  //       defaultValue: spec.defaultValue,
  //       enumValues: spec.enumValues,
  //       check: spec.check,
  //     });

  //     // Apply inline constraints per column
  //     if (spec.primaryKey) { t.addPrimaryKey(colName, [colName]); }
  //     if (spec.unique) { t.addUnique(colName, [colName]); }
  //     if (spec.foreignKey) {
  //       t.addForeignKey(colName, [colName], spec.foreignKey.table, spec.foreignKey.foreignColumns);
  //     }
  //     //handle check constraints, too
  //   }

  //   if (constraintSchema) {
  //     for (const [name, spec] of Object.entries(constraintSchema)) {
  //       if (spec.kind === "PRIMARY KEY") { t.addPrimaryKey(name, spec.columns); }
  //       if (spec.kind === "UNIQUE") { t.addUnique(name, spec.columns); }
  //       if (spec.kind === "FOREIGN KEY") {
  //         if (!spec.columns || !spec.parentTable || !spec.parentColumns) {
  //           throw new Error(`Spec missing required propeties`);
  //         }
  //         t.addForeignKey(
  //           name,
  //           spec.columns, // TODO: how to validate this?
  //           spec.parentTable,
  //           spec.parentColumns);
  //       }
  //       //handle check constraints, too
  //     }
  //   }

  //   return t;
  // }

  //  <columns>
  public requireColumn(columnName: string): Column {
    const column = this.cols.get(columnName);
    if (!column) {
      throw new Error(`Invariant violation: missing column '${columnName}'`);
    }
    return column;
  }

  public requireColumnData(columnName: string): ColumnValue[] {
    //const column = this.requireColumn(columnName);
    const data = this.data.get(columnName);
    if (!data) {
      throw new Error(`Data array missing for column '${columnName}'`);
    }
    return data;
  }

  private requireColumnNameUnused(name: string) {
    if (this.cols.has(name)) {
      throw new Error(`Column ${name} already exists`);
    }
  }

  public addColumn(column: Column) {
    this.requireColumnNameUnused(column.name);

    if (column.autoIncrement && column.type !== Number) { //move to validate column object?
      throw new Error(`Column ${column.name} can only autoIncrement as type Number.`);
    }
    if (!column.nullable && column.defaultValue === undefined) {
      throw new Error(`Column ${column.name} is not nullable and has no default value.`);
    }
    this.cols.set(column.name, column);
    this.data.set(column.name, []);
  }

  public dropColumn(name: string) {
    this.requireColumn(name);

    const referencing = this.constraints.getConstraintsReferencingColumn(name);
    if (referencing.length > 0) {
      throw new Error(
        `Cannot drop column ${name}; it is referenced by constraints: ${referencing
        .map(c => c.name)
        .join(", ")}`
      );
    }

    this.cols.delete(name);
    this.data.delete(name);
  }

  public renameColumn(oldName: string, newName: string) {
    const col: Column = this.requireColumn(oldName);
    this.requireColumnNameUnused(newName);

    this.constraints.renameColumn(oldName, newName);

    col.name = newName;
    this.cols.delete(oldName);
    this.cols.set(newName, col);

    const data = this.data.get(oldName)!;
    this.data.delete(oldName);
    this.data.set(newName, data);
  }



  public alterColumn(name: string, newColumn: Column) {
    const oldColumn = this.requireColumn(name);

    if (!widens(oldColumn.type, newColumn.type)) {
      throw new Error(
        `Cannot alter column ${name}: ${oldColumn.type} cannot convert to ${newColumn.type}`
      );
    }

    oldColumn.type = newColumn.type;
    oldColumn.nullable = newColumn.nullable;

    const columnData = this.requireColumnData(name);
    for (let i = 0; i < columnData.length; i++) {
      columnData[i] = widenValue(oldColumn.type, columnData[i]);
    }

    // TODO: Validate constraints that reference this column if needed
    const affectedConstraints = this.constraints.getConstraintsReferencingColumn(name);
    for (const constraint of affectedConstraints) {
      if ("index" in constraint) { // Pk or Unique
        if (!canBeIndexed(newColumn.type)) {
          throw new Error(
            `Cannot alter column ${name}: type change breaks constraint ${constraint.name}`
          );
        }
        this.rebuildIndex(constraint);
      } else if ("parentTable" in constraint) { // Foreign Key
        // Usually handled in validator; just warn or skip
      } else if ("expr" in constraint) { // Check
        if (!constraint.expr.isValidForType(newColumn.type)) {
          throw new Error(
            `Cannot alter column ${name}: type change breaks CHECK constraint ${constraint.name}`
          );
        }
      }
    }
  }
  //  </columns>


  //  <constraints>
  public addConstraint(spec: ConstraintSpec) {
    switch (spec.kind) {
      case CONSTRAINT_KIND.primaryKey:
        return this.addPrimaryKey(spec);
      case CONSTRAINT_KIND.unique:
        return this.addUnique(spec);
      case CONSTRAINT_KIND.foreignKey:
        return this.addForeignKey(spec);
      case CONSTRAINT_KIND.check:
        return this.addCheck(spec);
    }
  }

  private validateConstraintColumns(columns: readonly string[]) {
    if (columns.length === 0) {
      throw new Error("Constraint requires at least one column");
    }

    if (new Set(columns).size !== columns.length) {
      throw new Error("Duplicate column in constraint");
    }

    for (const column of columns) {
      this.requireColumn(column);
    }
  }

  public getConstraint(name: string): Constraint | undefined {
    return this.constraints.getByName(name);
  }

  public requireConstraint(name: string): Constraint {
    const constraint = this.getConstraint(name);
    if (!constraint) {
      throw new Error(`Constraint ${name} does not exist`);
    }
    return constraint;
  }

  public requirePrimaryKeyUnique(): Unique {
    const pk = this.constraints.requirePrimaryKey();
    const unique = this.constraints.requireByName(pk.name) as Unique;
    return unique;
  }

  public dropConstraint(spec: DropConstraintSpec): void {
    let name: string;
    if ("kind" in spec && spec.kind === CONSTRAINT_KIND.primaryKey) {
      name = this.constraints.requirePrimaryKey().name;
    } else if ("name" in spec) {
      name = spec.name;
    } else {
      throw new Error("Invalid DropConstraintSpec");
    }

    this.constraints.dropByName(name);
  }

  private addPrimaryKey(spec: ConstraintSpec) {
    this.validateConstraintColumns(spec.columns);

    spec.columns.forEach(columnName => {
      if (this.requireColumn(columnName).nullable !== false) {
        throw new Error(`Cannot set Primary Key. Column ${columnName} isn't defined as not nullable.`);
      }
    });

    const columnIndices = this.getColumnIndices(spec.columns);

    this.constraints.addPrimaryKey(spec, columnIndices);
  }

  private addUnique(spec: ConstraintSpec) {
    this.validateConstraintColumns(spec.columns);

    const columnIndices = this.getColumnIndices(spec.columns);

    this.constraints.addUnique(spec, columnIndices);
  }

  private getColumnIndices(columnNames: string[]): number[] {
    const tableCols = Array.from(this.cols.keys());
    return columnNames.map(name => {
      const idx = tableCols.findIndex(c => c === name);
      if (idx === -1) throw new Error(`Column '${name}' does not exist in table`);
      return idx;
    });
  }

  private addForeignKey(spec: ConstraintSpec) {
    this.validateConstraintColumns(spec.columns);

    this.constraints.addForeignKey(spec);
  }

  private addCheck(spec: ConstraintSpec) {
    this.validateConstraintColumns(spec.columns);

    this.constraints.addCheck(spec);
  }

  public rebuildIndex(constraint: Unique) {
    constraint.index.clear();
    const keys = this.indexOnColumns(constraint.columns);
    for (const key of keys) {
      if (key !== null) constraint.index.add(key);
    }
  }

  public indexOnColumns(columns: string[]): Array<string | null> {
    const columnArrays = columns.map(col => this.requireColumnData(col));
    const indexKeys: Array<string | null> = [];

    for (let i = 0; i < this.numRows; i++) {
      if (!this.rowAlive[i]) {
        indexKeys.push(null);
        continue;
      }
      const values = columnArrays.map(arr => arr[i]);
      indexKeys.push(uniqueKeyFromArray(values));
    }

    return indexKeys;
  }

  public insertInto(insertRows: InsertRow[], txId: number): void {
    insertRows.forEach(row => {  
      const resolvedRow: ColumnValue[] = row.map((cell: InsertCell) => this.resolveCellValue(cell));

      this.checkColumnConstraints(resolvedRow); // NOT NULL, TYPE

      this.checkTableConstraints(resolvedRow); // UNIQUE, FK, CHECK

      //this.storeRow(resolvedRow, txId);
    });
  }

  private resolveCellValue(cell: InsertCell): ColumnValue {
    switch (cell.input.kind) {
      case "value":
        return cell.input.value;
      case "default":
        if (cell.column.autoIncrement) {
          const val = cell.column.autoIncrement.next;
          cell.column.autoIncrement.next += cell.column.autoIncrement.step;
          return val;
        } else if (cell.column.defaultValue !== undefined) {
          return resolveDefault(cell.column)!;
        } else {
          return null; // or throw if NOT NULL
        }
      case "null":
        return null;
      //case "expression":
      //  return evaluateExpression(cell.input.expr);
      default:
        throw new Error(`InsertCell input kind: ${cell.input.kind} not supported.`);
    }
  }

  checkColumnConstraints(resolvedRow: ColumnValue[]) {
    const tableCols = Array.from(this.cols.values());

    if (resolvedRow.length !== tableCols.length) {
      throw new Error(`Resolved row length mismatch with table columns`);
    }

    for (let i = 0; i < tableCols.length; i++) {
      const col = tableCols[i];
      const val = resolvedRow[i];

      // NOT NULL
      if (!col.nullable && val === null) {
        throw new Error(`Column '${col.name}' cannot be NULL`);
      }

      // Type check
      if (!matchesColumnType(val, col.type)) {
        throw new Error(`Column '${col.name}' expected type ${col.type}`);
      }

      // Enum values
      if (col.enumValues && !col.enumValues.includes(val)) {
        throw new Error(`Column '${col.name}' value '${val}' not in allowed enum`);
      }
    }
  }

  checkTableConstraints(resolvedRow: ColumnValue[]) {
    // --- UNIQUE constraints ---
    if (this.constraints.uniques) {
      for (const [name, unique] of this.constraints.uniques) {
        const arrayOfValues: ColumnValue[] = [];

        // collect values for the columns listed in unique.columns
        for (const idx of unique.columnIndices) {
          arrayOfValues.push(resolvedRow[idx]);
        }

        const key = uniqueKeyFromArray(arrayOfValues); // returns null if any value is null
        if (key !== null && unique.index.has(key)) {
          throw new Error(`Unique constraint '${name}' violated for values: (${arrayOfValues.join(", ")})`);
        }

        // Passed the check, add to index
        if (key !== null) {
          unique.index.add(key);
        }
      }
    }

    // --- CHECK constraints ---
    if (this.constraints.checks) {
      for (const [name, check] of this.constraints.checks) {
        // evaluate the check expression in the context of the resolved row
        // assuming check.expr is a function (ResolvedRow, Table) => boolean
        if (!check.expr(resolvedRow, this)) {
          throw new Error(`Check constraint '${name}' violated`);
        }
      }
    }

    // Note: Foreign keys are assumed to be validated upstream in the Action/Validator
  }
}

function matchesColumnType(value: any, type: ColumnType): boolean {
  if (value === null) return true; // nullability handled separately

  switch (type) {
    case String:
      return typeof value === "string";
    case Number:
      return typeof value === "number" && !Number.isNaN(value);
    case Boolean:
      return typeof value === "boolean";
    case "expression":
      return typeof value === "object" && value !== null && "kind" in value;
    case "function":
      return typeof value === "object" && value !== null && typeof (value as any).fn === "function";
    default:
      return false;
  }
}

function uniqueKeyFromArray(input: ColumnValue[]) {
  if (input.some(v => v === null)) return null;
  return JSON.stringify(input);
}