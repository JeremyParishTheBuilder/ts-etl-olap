import { ColumnBoundImmutable } from "./ColumnBoundImmutable.js";
import { type ColumnId, type ColumnType } from "./Column.js"; 

export type CheckId = number & { readonly __brand: "CheckId" };

export class Check extends ColumnBoundImmutable {

  public readonly id: CheckId;
  public readonly name: string;
  public readonly columns: ColumnId[];
  public readonly expression: undefined;

  protected constructor(spec: {
    id: CheckId,
    name: string,
    columns: ColumnId[],
    expression: undefined,
  }) {
    super();

    this.id = spec.id;
    this.name = spec.name;
    this.columns = spec.columns;
    this.expression = spec.expression;

    this.validate();
    this.seal();
  }
  validate() {
    super.validateColumns();
    //TODO, write validateExpression()
  }

  public static create(spec: {
    id: CheckId,
    name: string,
    columns: ColumnId[],
    expression: undefined,
  }): Check {
    return new this(spec);
  }

  public rename(newName: string): Check {
    return this.with({
      name: newName
    } as Partial<this>);
  }

  public tryAlterColumn(id: ColumnId, newType: ColumnType): Check {
    return this;
  }
}
