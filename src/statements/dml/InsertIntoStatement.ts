import { Statement } from "../Statement.js";
import { InsertIntoAction } from "../../actions/InsertIntoAction.js";
import { ColumnValue }  from "../../types/Column.js";

export class InsertIntoStatement extends Statement<void> {
  constructor(
    public table: string,
    public columns: string[] = [],
  ) {
    super();
  }

  values(values: ColumnValue[][]) {
    //convertSyntaxValuesIntoSemanticValues(values, ctx.rules.values.keywords);
    this.addAction(new InsertIntoAction(this.table, this.columns, values));
  }
}