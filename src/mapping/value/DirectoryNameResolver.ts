// import { type ColumnValue } from "../../types/ColumnValue.js";
// import { Directory } from "../discovery/Directory.js";
// import { type DiscoveryContext } from "../discovery/DiscoveryContext.js";
// import { type DiscoveryValueResolver } from "./DiscoveryValueResolver.js";

// export class DirectoryNameResolver implements DiscoveryValueResolver {
//   resolve(
//     context: DiscoveryContext
//   ): ColumnValue {
//     const current = context.current;

//     if (!(current instanceof Directory)) {
//       throw new Error(
//         "DirectoryNameResolver requires a Directory."
//       );
//     }

//     return current.basename;
//   }
// }