//import Pointer from './Pointer.js';
import NewPointer from './NewPointer.js';
import Container from './Container.js';
import Directory from './Directory.js';
import File from './File.js';
import RegistryStructureEntry from './RegistryStructureEntry.js';

abstract class RegistryObject {

  protected _pointer: NewPointer<any> | null = null;
  public get pointer(): NewPointer<any> { return this._pointer!; }
  //public get pointer(): NewPointer<any> | undefined | null { return this._pointer; }
  //public get key(): any { return this._pointer?.key; }
  //public get parent(): any { return this._pointer?.parent; }
  //abstract keyType: new () => any;


  /*abstract*/ public keyType: any;



  //abstract get parentType(): InstanceType<typeof RegistryObject>;

  constructor(pointer: NewPointer<any> | null, json: Record<string, any> | null = null) {
    this._pointer = pointer;
    this._jsonProperties = json; //optional json at construction (when not lazy loading)
  }

  //--Key Files and Directories--
  protected _keyFiles: Map<string, File | undefined> = new Map(); //Stores Files like: Assetlist, Chain & Versions.
  protected _keyDirectories: Map<string, Directory | undefined> = new Map(); //Stores Directories like: /images/.

  public static readonly FileName = {}
  public get FileName() {
    return RegistryObject.FileName
  }
  protected file(name?: string): File | undefined { return undefined; }

  public static readonly DirectoryName = {}
  public get DirectoryName() {
    return RegistryObject.DirectoryName
  }
  protected directory(name?: string): Directory | null | undefined { return undefined; }

  /*uncomment this when structure is ready
   protected directory(name?: string): Directory | null | undefined {
    const selfDir = getDirectories(fsStructure, "Chain", this.pointer.key)[0]; // Only one
    if (!selfDir) return null;

    if (!name) return selfDir;

    return selfDir.find(entry.directory(name), Directory);
  }*/

  /*public file(name: string): File | undefined {
    if (!Object.values(this.FileName).includes(name)) return undefined;
    if (!this._keyFiles.has(name)) this._keyFiles.set(name, this.directory()?.find(name, File));
    return this._keyFiles.get(name);
  }*/



  /*public get(
    objectType: (new (...args: any[]) => RegistryObject),
    key: RegistryObject["keyType"]
  ): RegistryObject | undefined {
    return this.container(objectType)?.get(key);
  };*/

  

  public get<T extends RegistryObject>(
    objectType: new (...args: any[]) => T,
    key: string | number
  ): T | undefined {
    if (!this.container(objectType)) { //Continer doesn't exist--need it init
      this.addContainer(objectType, new Container(objectType));
      if (typeof key === "string") {
        this.container(objectType)?.init(this.getKeys(objectType));
      } else if (typeof key === "number") {
        this.container(objectType)?.init(this.getSize(objectType));
      }
    }
    if (this.container(objectType)?.get(key) === undefined) return undefined; // Base denom doesn't exist
    if (this.container(objectType)?.get(key) === null) { // Base denom does exist, but no object has been created
      this.container(objectType)?.set(key, new objectType(this.pointer, key)); // Lazy-load asset
    }
    return this.container(objectType)?.get(key)!;
  }

  public getEntry<
    T extends RegistryObject, // RegistryObject type
    P extends RegistryObject, // Parent RegistryObject type
    K = string | number, // Key type
    E = any
  >(
    objectType: new (...args: any[]) => RegistryObject
  ): RegistryStructureEntry<T, P, K, E> {
    const entry = this.pointer.root.object.registryStructureMap.get(objectType);
    if (!entry) {
      throw new Error(`No registry structure entry found for ${objectType.name}`);
    }
    return entry;
  }

  public getKeys<T extends RegistryObject>(
    objectType: new (...args: any[]) => T,
    parent?: RegistryObject
  ): Array<T["keyType"]> {
    return this.getEntry(objectType).getKeys(this);
  }

  public getSize<T extends RegistryObject>(
    objectType: new (...args: any[]) => RegistryObject,
    parent?: RegistryObject
  ): number {
    return this.getEntry(objectType).getSize(this);
  }

  protected _containers: Map<(new (...args: any[]) => RegistryObject), Container<any>> = new Map();

  protected container<T extends RegistryObject>(
    objectType: new (...args: any[]) => T
  ): Container<T> | undefined {
    return this._containers.get(objectType) as Container<T> | undefined;
  }

  /*public container<T extends RegistryObject>(
    objectType: new (...args: any[]) => T,
    createIfMissing = false
  ): Container<T> | undefined {
    let container = this._containers.get(objectType) as Container<T> | undefined;

    if (!container && createIfMissing) {
      container = new Container(objectType);
      this._containers.set(objectType, container);
    }

    return container;
  }*/

  protected addContainer<T extends RegistryObject>(
    objectType: new (...args: any[]) => T,
    container: Container<T>
  ): void {
    this._containers.set(objectType, container);
  }

  /*public getKeys<T extends RegistryObject>(
    objectType: new (...args: any[]) => RegistryObject,
    parent?: RegistryObject
  ): Array<T["keyType"]> {
    return [];
  }*/

  /*public getKeys<T extends RegistryObject>(
    objectType: new (...args: any[]) => RegistryObject,
    parent?: RegistryObject
  ): Array<T["keyType"]> {
    const registry = this.pointer.root.object as RegistryObject & { getKeys?: Function };
    return registry?.getKeys?.(objectType, parent ?? this) ?? [];
  }*/


  

  protected loadProperties(): void {
    //if (this._jsonProperties === null) this._jsonProperties = this.fetchJsonProperties() || {};
    if (this._jsonProperties === null) {
      //console.log("entry");
      //console.log(this.pointer.root.object.registryStructureMap.get(this.constructor));
      //console.log("in loadProperties() key");
      //console.log(this.pointer.key);
      this._jsonProperties = this.pointer.root.object.registryStructureMap.get(this.constructor).fetchJsonProperties(this.pointer.parent.object, this.pointer.key) || {};
    }
  }

  public property<T = any>(propertyName: string): T | undefined {

    //Override Json values
    if (Object.values(this.OverridePropertyName).includes(propertyName)) {
      if (this._overrideProperties === null) this._overrideProperties = {};
      if (propertyName in this._overrideProperties) return this._overrideProperties[propertyName] as T;
      return this.overrideProperties(propertyName) as T;
    }

    //Json Properties
    if (this._jsonProperties === null) this.loadProperties();
    if (!this._jsonProperties) return undefined;
    if (propertyName in this._jsonProperties) return this._jsonProperties[propertyName] as T;

    //Derived Properties (fallback, if not in json)
    if (Object.values(this.DerivedPropertyName).includes(propertyName)) {
      if (this._derivedProperties === null) this._derivedProperties = {};
      if (propertyName in this._derivedProperties) return this._derivedProperties[propertyName] as T;
      return this.derivedProperty(propertyName) as T;
    }

    return undefined;
  }

  //--JSON Properties--
  protected _jsonProperties: Record<string, any> | null = null;

  protected fetchJsonProperties(): Record<string, any> | null {
    return null; // Default to passed in param/null; subclasses should provide actual implementation
  }


  //--


  //--Derived Properties--
  protected _derivedProperties: Record<string, any> | null = null;

  public static readonly DerivedPropertyName = {}
  public get DerivedPropertyName() {
    return RegistryObject.DerivedPropertyName
  }

  protected derivedProperty<T = any>(propertyName: string): T | undefined {
    return undefined;
  }
  //--

  //--Override Properties--
  protected _overrideProperties: Record<string, any> | null = null;

  public static readonly OverridePropertyName = {}
  public get OverridePropertyName() {
    return RegistryObject.OverridePropertyName
  }

  protected overrideProperties<T = any>(propertyName: string): T | undefined {
    return undefined;
  }
  //--

  public toJSON(): any {
    if (this._jsonProperties === null) this.loadProperties();
    return { ...this._jsonProperties };
  }

  public print(): void {
    console.log(this.toJSON());
  }

  public pointers<T extends RegistryObject>(objectType: new (...args: any[]) => T): NewPointer<T>[] {
    let container = this.container(objectType);
    if (!container) { //Continer doesn't exist--need it init
      //console.log(`Initializing`);
      const keys = this.getKeys(objectType);
      //console.log(keys);
      if (!keys) return [];
      this.addContainer(objectType, new Container(objectType));
      //console.log(this.container(objectType));
      this.container(objectType)?.init(keys);
      container = this.container(objectType);
      //console.log(this.getKeys(objectType));
      //console.log(this.container(objectType));
    }
    //const container = this.container(objectType);
    //console.log("container");
    //console.log(container);
    if (!container) return [];
    //console.log("comparing");
    //if (container.keys().length !== container.values().length) 
    if (container.values().includes(null)) {
      //console.log("includes null");
      const keys = container.keys();
      keys.forEach(key => {
        //const value = new objectType(key)
        /*console.log("creating");
        console.log(key);*/
        container!.set(key, new objectType(this.pointer, key));
        //console.log(this.get(objectType, key));
      });
    }
    return container.pointers();
  }

  public find<T extends RegistryObject>(
    objectType: new (...args: any[]) => T,
    conditions?: Array<(pointer: NewPointer<T>) => boolean>
  ): Array<NewPointer<T>> {
    const array = this.pointers(objectType);
    if (!array) return [];
    let result = [...array];
    for (const condition of conditions || []) {
      result = result.filter(condition);
    }
    return result;
  }

  /*public static objectsNew<T>(array: Array<NewPointer<RegistryObject>>, conditions?: Array<(item: T) => boolean>): T[] {
    if (!array.length) return [];
    let result = [...array]; // Copy to prevent mutation
    for (const condition of conditions || []) {
      result = result.filter(condition);
    }
    return result;
  }*/

  public static objects<T>(array: Array<T>, conditions?: Array<(item: T) => boolean>): T[] {
    if (!array.length) return [];
    let result = [...array]; // Copy to prevent mutation
    for (const condition of conditions || []) {
      result = result.filter(condition);
    }
    return result;
  }
}

export function arrayToJson(registryObjectArray: Array<RegistryObject>): Record < string, any > | undefined {
  let jsonArray: any[] = [];
  registryObjectArray.forEach(registryObject => {
    jsonArray.push(registryObject.toJSON());
  });
  return jsonArray.length ? jsonArray : undefined;
}

export default RegistryObject;