import { type ColumnId } from "../relational/Column.js";
import { type DatabaseId } from "../relational/Database.js";
import { type ForeignKeyId } from "../relational/ForeignKey.js";
import { type IndexId } from "../relational/Index.js";
import { type TableId } from "../relational/Table.js";
import { type UniqueId } from "../relational/Unique.js";

export class IdAllocator<T extends number> {
  constructor(private readonly next: T = 1 as T) {}

  allocate(): [T, IdAllocator<T>] {
    return [this.next, new IdAllocator((this.next + 1) as T)];
  }
}

export interface IdService {
  nextDatabaseId(): DatabaseId;
  nextTableId(): TableId;
  nextColumnId(): ColumnId;
  nextForeignKeyId(): ForeignKeyId;
  nextIndexId(): IndexId;
  nextUniqueId(): UniqueId;
}