import { type ColumnId } from "../schema/Column.js";
import { type ForeignKeyId } from "../schema/ForeignKey.js";
import { type IndexId } from "../schema/Index.js";
import { type TableId } from "../schema/Table.js";

export class IdAllocator<T extends number> {
  constructor(private readonly next: T = 1 as T) {}

  allocate(): [T, IdAllocator<T>] {
    return [this.next, new IdAllocator((this.next + 1) as T)];
  }
}

export interface IdService {
  nextTableId(): TableId;
  nextColumnId(): ColumnId;
  nextForeignKeyId(): ForeignKeyId;
  nextIndexId(): IndexId;
}