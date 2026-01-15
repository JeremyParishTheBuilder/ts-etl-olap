import { Action } from "./Action.js";
import type { EngineContext } from "../engine/EngineContext.js";
import type { DropConstraintSpec } from "../types/Constraint.js";

export class DropConstraintAction implements Action {
  constructor(
    private table: string,
    private spec: DropConstraintSpec,
  ) {}

  apply(ctx: EngineContext) {   
    //ctx.validate.dropConstraint(this.table, this.constraint);
    // TODO: definitely need when other tables have a foreign key referencing this table's primary key

    ctx.resolver
      .requireTable(true, this.table)
      .dropConstraint(this.spec);
  }
}