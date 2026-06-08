import { type ColumnId } from "../schema/Column";
import { type ForeignKeyId } from "../schema/ForeignKey";
import { type IndexId } from "../schema/Index";
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