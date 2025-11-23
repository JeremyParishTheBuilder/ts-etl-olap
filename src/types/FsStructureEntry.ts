import Directory from './Directory.js';
import File from './File.js';
import DirectoryContent from './DirectoryContent.js';

class FsStructureEntry {

  private _id: string;
  private _fsType: typeof Directory | typeof File;
  private _parent: FsStructureEntry | Directory;
  private _types: string[] | null = null;
  private _name: (key?: string) => string;
  private _qualify: (item: DirectoryContent) => boolean;

  private _directories: FsStructureEntry[] = [];
  private _files: FsStructureEntry[] = [];

  constructor(
    id: string,
    fsType: typeof Directory | typeof File,
    parent: FsStructureEntry | Directory,
    types: string[] | null,
    name: (key?: string) => string,
    qualify?: (item: DirectoryContent) => boolean
  ) {
    this._id = id;
    this._fsType = fsType;
    this._parent = parent;
    this._types = types;
    this._name = name; 
    this._qualify = qualify ?? (() => true);
  }

  public get name(): (key?: string) => string { return this._name; }
  public get parent(): FsStructureEntry | Directory { return this._parent; }
  public get fsType(): typeof Directory | typeof File { return this._fsType; }

  public add(item: FsStructureEntry): void {
    if (item.parent === this) return;
    if (item.fsType instanceof Directory) {
      this._directories.push(item);
    }
    if (item.fsType instanceof File) {
      this._files.push(item);
    }
    return;
  }

  // Call find on a FsStructureEntry type to get a specific instance of the entry type
  // or omit the key to get all elements of that type 
  // e.g., chainDirectory.find(Directory, "chainname") -> [chainname's chainDirectory]
  // e.g., chainDirectory.find(Directory) -> [all chainDirectorys]
  public find<T extends DirectoryContent>(
    itemType: { new (...args: any[]): T },
    key?: string
  ): T[] {

    const parentDirs = this._parent instanceof Directory
      ? this._parent.find(Directory, ".")
      : this._parent.find(Directory);
    // const parentDirs = this._parent === null
    //   ? this._
    //   : this._parent.find(Directory);

    const resolvedKeys = key
      ? [key]
      : this._types?.length ? this._types : [undefined];

    const itemNames = resolvedKeys
      .map(k => this._name(k))
      .filter((n): n is string => !!n);

    return parentDirs.flatMap(parent =>
      itemNames.length > 0
        ? itemNames.flatMap(name => parent.find(itemType, name))
        : parent.find(itemType)//.filter(() => this._qualify()) // no name → get all of this type
    ).filter(item => this._qualify(item));

  }
  
}

export default FsStructureEntry;