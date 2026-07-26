import { type ColumnId } from "../relational/Column";
import { type ForeignKeyId } from "../relational/ForeignKey";
import { type IndexId } from "../relational/Index";
import { type IdService, type IdAllocator } from "../types/IdAllocator.js";

// export class EngineIdService implements IdService {
//   constructor(private allocators: {
//     column: IdAllocator<ColumnId>;
//     foreignKey: IdAllocator<ForeignKeyId>;
//     index: IdAllocator<IndexId>;
//   }) {}

//   nextColumnId() {
//     return this.allocators.column.allocate();
//   }

//   nextIndexId() {
//     return this.allocators.index.allocate();
//   }

//   nextForeignKeyId() {
//     return this.allocators.foreignKey.allocate();
//   }
// }