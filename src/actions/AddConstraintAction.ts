import { Action } from "./Action.js";
import type { EngineContext } from "../engine/EngineContext.js";
import { type ConstraintSpec } from "../types/Constraint.js";

export class AddConstraintAction implements Action {
  constructor(
    private table: string,
    private constraint: ConstraintSpec,
    private inline: boolean = false,
  ) {}

  apply(ctx: EngineContext) {
    if (this.inline && !ctx.rules.ddl.supportsInlineForeignKeys) {
      return;
    }

    ctx.validate.addConstraint(this.table, this.constraint); // <-dispatcher

    ctx.resolver
      .requireTable(true, this.table)
      .addConstraint(this.constraint);
  }
}