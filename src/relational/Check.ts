import { ColumnBoundImmutable } from "./ColumnBoundImmutable.js";
import { type ColumnId } from "./Column.js";
import { type Predicate } from "../evaluation/predicate/Predicate.js";
import { type ResolvedPredicateNode } from "../ast/predicate/PredicateNode.js";
import { ResolvedPredicateColumnCollector } from "../utils/PredicateColumnCollector.js";
import { bindPredicate } from "../semantic/predicate.js";
import { type Table } from "./Table.js";

export type CheckId = number & { readonly __brand: "CheckId" };

export class Check extends ColumnBoundImmutable {
  public readonly id: CheckId;
  public readonly name: string;
  public readonly columns: ColumnId[];
  public readonly resolvedPredicate: ResolvedPredicateNode;
  public readonly predicate: Predicate;

  protected constructor(spec: {
    id: CheckId;
    name: string;
    columns: ColumnId[];
    resolvedPredicate: ResolvedPredicateNode;
    predicate: Predicate;
  }) {
    super();

    this.id = spec.id;
    this.name = spec.name;
    this.columns = spec.columns;
    this.resolvedPredicate = spec.resolvedPredicate;
    this.predicate = spec.predicate;

    this.validate();
    this.seal();
  }
  validate() {
    super.validateColumns();
  }

  public static create(spec: {
    id: CheckId;
    name: string;
    resolvedPredicate: ResolvedPredicateNode;
    predicate: Predicate;
  }): Check {
    const columnIds = ResolvedPredicateColumnCollector.collect(
      spec.resolvedPredicate,
    );
    return new this({
      ...spec,
      columns: columnIds,
    });
  }

  public rename(newName: string): Check {
    return this.with({
      name: newName,
    } as Partial<this>);
  }

  public tryBindPredicate(table: Table) {
    return this.with({
      predicate: bindPredicate(this.resolvedPredicate, table),
    } as Partial<this>);
  }
}
