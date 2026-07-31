import { Immutable } from "../infrastructure/Immutable.js";
import { type IndexId } from "./Index.js";

export type UniqueId = number & { readonly __brand: "UniqueId" };

export class Unique extends Immutable {
  public readonly id: UniqueId;
  public readonly name: string;
  public readonly index: IndexId;
  public readonly ownsIndex: boolean;

  protected constructor(spec: {
    id: UniqueId;
    name: string;
    index: IndexId;
    ownsIndex: boolean;
  }) {
    super();

    this.id = spec.id;
    this.name = spec.name;
    this.index = spec.index;
    this.ownsIndex = spec.ownsIndex;

    this.validate();
    this.seal();
  }
  validate(): void {}

  public static create(spec: {
    id: UniqueId;
    name: string;
    index: IndexId;
    ownsIndex: boolean;
  }): Unique {
    return new this(spec);
  }

  public rename(newName: string): Unique {
    return this.with({
      name: newName,
    } as Partial<this>);
  }

  public static defaultIndexName(name: string): string {
    return name.concat("_UCIDX");
  }
}
