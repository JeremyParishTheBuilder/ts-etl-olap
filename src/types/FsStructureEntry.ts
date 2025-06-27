import Directory from './Directory.js';
import File from './File.js';

class FsStructureEntry {

  private _id: string;
  private _fsType: typeof Directory | typeof File;
  private _parent: FsStructureEntry | Directory;
  private _types: string[] | null = null;
  private _name: (key?: string) => string;

  private _directories: FsStructureEntry[] = [];
  private _files: FsStructureEntry[] = [];

  constructor(
    id: string,
    fsType: typeof Directory | typeof File,
    parent: FsStructureEntry | Directory,
    types: string[] | null,
    name: (key?: string) => string,
  ) {
    this._id = id;
    this._fsType = fsType,
    this._parent = parent;
    this._types = types;
    this._name = name;
  }

  public getDirectories(key?: string): Directory[] {
    if (this._parent instanceof Directory) return [this._parent];
    const parentDirs: Directory[] = this._parent.getDirectories();

    return parentDirs.flatMap((parent) => {
      const keys = key ? [key] : this._types;
      const dirNames = keys
        ? keys.map(k => this._name?.(k)).filter((n): n is string => !!n)
        : [this._name?.()].filter((n): n is string => !!n);

      return dirNames
        .map(dirName => parent.find(dirName, Directory))
        .filter((found): found is Directory => found instanceof Directory);
    });
  }

  public get name(): (key?: string) => string {
    return this._name;
  }

  public get parent(): FsStructureEntry | Directory {
    return this._parent;
  }
  public get fsType(): typeof Directory | typeof File {
    return this._fsType;
  }

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

  public getFiles(key?: string): File[] {
    if (this._parent instanceof Directory) return [];
    const parentDirs: Directory[] = this._parent.getDirectories();

    return parentDirs.flatMap((parent) => {
      const keys = key ? [key] : this._types;
      const fileNames = keys
        ? keys.map(k => this._name?.(k)).filter((n): n is string => !!n)
        : [this._name?.()].filter((n): n is string => !!n);

      return fileNames
        .map(fileNames => parent.find(fileNames, File))
        .filter((found): found is File => found instanceof File);
    });
  }

}

export default FsStructureEntry;