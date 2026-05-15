import { ColumnBoundImmutable } from "./ColumnBoundImmutable.js";
import { type ColumnType } from "./Column.js"; 
import { type CheckSpec } from "./Constraint.js";
import { normalizeIdentifier } from "../utils/normalizeIdentifier.js";

export class Check extends ColumnBoundImmutable {
  protected constructor(
    public name: string,
    public columns: string[],
    public expression: undefined,
  ) {
    super();
    this.validate();
    this.seal();
  }
  validate() {
    super.validateColumns();
    //TODO, write validateExpression()
  }

  public static fromSpec(spec: CheckSpec): Check {
    return new this(
      spec.name,
      spec.columns.map(normalizeIdentifier),
      spec.expression ?? undefined, //TODO
    )
  }

  public rename(newName: string): Check {
    return this.with({
      name: newName
    } as Partial<this>);
  }

  public tryAlterColumn(name: string, newType: ColumnType): Check {
    const normalizedName = normalizeIdentifier(name); 
    return this;
  }
}
