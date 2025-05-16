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
      /*const keys = key ? [key] : this._types ?? []; //what if there's no key or types, but just one possible value?
      return keys
        .map(k => this._name?.(k))
        .filter((dirName): dirName is string => !!dirName)
        .map(dirName => parent.find(dirName, Directory))
        .filter((found): found is Directory => found instanceof Directory);*/
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
    //console.log("calling get files");
    //console.log(`Key: ${key}`);
    if (this._parent instanceof Directory) return [];
    //console.log("parent was not Directory");
    const parentDirs: Directory[] = this._parent.getDirectories();
    //console.log("what is this._parent?");
    //console.log(this._parent);
    //console.log("what is parentDirs?");
    //console.log(parentDirs);

    return parentDirs.flatMap((parent) => {
      const keys = key ? [key] : this._types;
      //console.log("keys");
      //console.log(keys);
      const fileNames = keys
        ? keys.map(k => this._name?.(k)).filter((n): n is string => !!n)
        : [this._name?.()].filter((n): n is string => !!n);
      //console.log("fileNames");
      //console.log(fileNames);

      return fileNames
        .map(fileNames => parent.find(fileNames, File))
        .filter((found): found is File => found instanceof File);
    });
  }

}

export default FsStructureEntry;


/*public getDirectories(key ?: string): Directory[] {
  //console.log("getting Directories");
  //if (this._parent instanceof Directory) return [this._parent];
  if (this._parent instanceof Directory) {
    *//*console.log("it is the root");
    console.log(this._parent);*//*
    return [this._parent];
  }
  //console.log("not root");

  //console.log("parent should be an entry");
  //console.log(this._parent);
  const parentDirs: Directory[] = this._parent.getDirectories();
  //console.log("parentDirs");
  //parentDirs.forEach(dir => console.log(dir.basename));
  //console.log(parentDirs);
  //console.log("why are there no parent dirs?");
  //const directories: Directory[] = [];

  return parentDirs.flatMap((parent) => {
    const keys = key ? [key] : this._types ?? [];
    return keys
      .map(k => this._name?.(k))
      .filter((dirName): dirName is string => !!dirName)
      .map(dirName => parent.find(dirName, Directory))
      .filter((found): found is Directory => found instanceof Directory);
  });

  *//*for (const parent of parentDirs) {
    const keys = key ? [key] : this.types ?? [];
    for (const k of keys) {
      const dirName = this.directory?.(k);
      if (!dirName) continue;

      const found = parent.find(dirName, Directory);
      if (found) directories.push(found);
    }
  }
  return directories;*//*
}*/