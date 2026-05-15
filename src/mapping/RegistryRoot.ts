import CONFIG from '../config.js';
import Pointer from './Pointer.js';
import RegistryObject from './RegistryObject.js';
import MultiRegistryRoot from './MultiRegistryRoot.js';
import RegistryStructureEntry from './RegistryStructureEntry.js';
import Directory from './Directory.js';

class RegistryRoot extends RegistryObject {

  public readonly directory: Directory;

  public constructor(
    public registryStructureMap: Map<
      string,
      RegistryStructureEntry<string | number, any>
    > | null,
    protected readonly key: string,
    path: string
  ) {
    const instance = MultiRegistryRoot.getInstance();
    super(new Pointer(instance.pointer, key, "RegistryRoot"));
    this.directory = new Directory(path);
    instance.set("RegistryRoot", key, this);
  }

  public getEntry(objectType: string): any {
    const entry = this.registryStructureMap?.get(objectType);
    if (!entry) {
      throw new Error(`No registry structure entry found for ${objectType}`);
    }
    return entry;
  }

  public keyType(objectType: string): string | number {
    return this.getEntry(objectType).keyPrototype;
  }

}

export default RegistryRoot;