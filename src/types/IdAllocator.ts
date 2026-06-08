import { type ColumnId } from "../schema/Column.js";
import { type ForeignKeyId } from "../schema/ForeignKey.js";
import { type IndexId } from "../schema/Index.js";

export class IdAllocator<T extends number> {
  constructor(private readonly next: T = 1 as T) {}

  allocate(): [T, IdAllocator<T>] {
    return [this.next, new IdAllocator((this.next + 1) as T)];
  }
}

export interface IdService {
  nextColumnId(): ColumnId;
  nextForeignKeyId(): ForeignKeyId;
  nextIndexId(): IndexId;
}