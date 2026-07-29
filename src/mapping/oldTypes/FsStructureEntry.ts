// import { Directory } from '../discovery/Directory.js';
// import { File } from '../discovery/File.js';
// import { FsObject } from '../discovery/FsObject.js';
// import RegistryRoot from './RegistryRoot.js';

// class FsStructureEntry {

//   private _id: string;
//   private _fsType: typeof Directory | typeof File;
//   private _parent: FsStructureEntry | null;
//   private _types: string[] | null = null;
//   private _name: (key?: string) => string;
//   private _qualify: (item: FsObject) => boolean;

//   // private _directories: FsStructureEntry[] = [];
//   // private _files: FsStructureEntry[] = [];

//   constructor(
//     id: string,
//     fsType: typeof Directory | typeof File,
//     parent: FsStructureEntry | null,
//     types: string[] | null,
//     name: (key?: string) => string,
//     qualify?: (item: FsObject) => boolean
//   ) {
//     this._id = id;
//     this._fsType = fsType;
//     this._parent = parent;
//     this._types = types;
//     this._name = name;
//     this._qualify = qualify ?? (() => true);
//   }

//   public get name(): (key?: string) => string { return this._name; }
//   public get parent(): FsStructureEntry | null { return this._parent; }
//   public get fsType(): typeof Directory | typeof File { return this._fsType; }

//   // public add(item: FsStructureEntry): void {
//   //   if (item.parent === this) return;
//   //   if (item.fsType instanceof Directory) {
//   //     this._directories.push(item);
//   //   }
//   //   if (item.fsType instanceof File) {
//   //     this._files.push(item);
//   //   }
//   //   return;
//   // }

//   public find<T extends FsObject>(
//     root: RegistryRoot,
//     itemType: { new (...args: any[]): T },
//     key?: string
//   ): T[] {

//     if (!this._parent) return [root.directory as unknown as T];

//     const parentDirs = this._parent.find(root, Directory);

//     const resolvedKeys = key
//       ? [key]
//       : this._types?.length ? this._types : [undefined];

//     const itemNames = resolvedKeys
//       .map(k => this._name(k))
//       .filter((n): n is string => !!n);

//     return parentDirs.flatMap(parent =>
//       itemNames.length > 0
//         ? itemNames.flatMap(name => parent.find(itemType, name))
//         : parent.find(itemType)
//     ).filter(item => this._qualify(item));

//   }

// }

// export default FsStructureEntry;
