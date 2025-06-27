import NewPointer from './NewPointer.js';
import Container from './Container.js';
import RegistryStructureEntry from './RegistryStructureEntry.js';

class RegistryObject {

  protected _pointer: NewPointer;
  public get pointer(): NewPointer { return this._pointer; }

  constructor(
    pointer: NewPointer,
    json: Record<string, any> | null = null
  ) {
    this._pointer = pointer;
    this._jsonProperties = json; //optional json at construction (when not lazy loading)
  }


  public getEntry(objectType: string): any {
    return this.root.getEntry(objectType);
  }

  public get root(): RegistryObject {
    return this.pointer.root.object;
  }

  public keyType(objectType: string): string | number {
    return this.root.keyType(objectType);
  }

  public getKeys(objectType: string): string[] {
    return this.root.getEntry(objectType).getKeys(this);
  }

  public getSize(objectType: string): number {
    return this.root.getEntry(objectType).getSize(this);
  }

  protected addContainer(
    objectType: string,
    container: Container
  ): void {
    this._containers.set(objectType, container);
  }


  protected loadProperties(): void {
    if (this._jsonProperties === null) {
      this._jsonProperties = this.root.getEntry(this.pointer.objectType).
        fetchJsonProperties(this.pointer.parent?.object, this.pointer.key)|| {};
    }
  }

  public property<T = any>(propertyName: string, args?: any): T | undefined {

    const entry = this.root.getEntry(this.pointer.objectType);
    if (args === undefined) args = entry.defaultArgs;

    if (args !== false) { // I need a better way to tell if there is an argument--this might work??
      //Override Json values
      const overrideProperty = entry.overrideProperties?.get(propertyName);
      if (overrideProperty) {
        return overrideProperty(this, args);
      }


      const argsProperty = entry.argsProperty;
      if (argsProperty) {
        return argsProperty(this, propertyName, args);
      }

    }

    //Json Properties
    if (this._jsonProperties === null) this.loadProperties();
    if (!this._jsonProperties) return undefined;
    if (propertyName in this._jsonProperties) return this._jsonProperties[propertyName] as T;

    //Derived Properties (fallback, if not in json)
    const derivedProperty = entry.derivedProperties?.get(propertyName);
    if (derivedProperty) {
      return derivedProperty(this, args);
    }

    return undefined;
  }

  protected _jsonProperties: Record<string, any> | null = null;
  protected _derivedProperties: Record<string, any> | null = null;
  protected _overrideProperties: Record<string, any> | null = null;

  public toJSON(): any {
    if (this._jsonProperties === null) this.loadProperties();
    return { ...this._jsonProperties };
  }

  public print(): void {
    console.log(this.toJSON());
  }


  protected _containers: Map<string, Container> = new Map();

  protected container(
    objectType: string
  ): Container | undefined {
    let container = this._containers.get(objectType);
    if (!container) {
      const keyType = this.root.keyType(objectType);
      let keys: string[] | number | null = null;
      if (typeof keyType === "string") {
        keys = this.getKeys(objectType);
      } else if (typeof keyType === "number") {
        keys = this.getSize(objectType);
      }
      if (!keys) return undefined;
      this._containers.set(objectType, new Container(objectType, keyType));
      container = this._containers.get(objectType);
      if (!container) return undefined;
      container.init(keys);
    }
    return container;
  }

  public get(
    objectType: string,
    key: string | number
  ): RegistryObject | undefined {
    const container = this.container(objectType);
    if (!container) return undefined;
    let object: RegistryObject | null | undefined = container.get(key);
    if (object === undefined) return undefined; // Base denom doesn't exist
    if (object === null) { // Base denom does exist, but no object has been created
      container.set(key, new RegistryObject(new NewPointer(this.pointer, key, objectType))); // Lazy-load asset
    }
    return container.get(key) ?? undefined;
  }

  /*
   * pointers() returns the pointers for all objects of a given objectType
   * contianed direct within this object (e.g., all assets within this chain)
   */
  public pointers(objectType: string): NewPointer[] {
    const container = this.container(objectType);
    if (!container) return [];
    if (container.values().includes(null)) {
      const keys = container.keys();
      keys.forEach(key => {
        container.set(key, new RegistryObject(new NewPointer(this.pointer, key, objectType)));
      });
    }
    return container.pointers();
  }

  public find(
    objectType: string,
    conditions?: Array<(pointer: NewPointer) => boolean>
    //all pointers need to be at the same level (can't have an asset pointer plus a chain pointer type)
  ): NewPointer[] {
    const entry: RegistryStructureEntry = this.root.getEntry(objectType);
    if (entry.parentType === null) return [];
    let array: NewPointer[] = [];
    if (entry.parentType !== this.pointer.objectType) {
      const parentArray = this.find(entry.parentType);
      parentArray.forEach((parent) => {
        array.push(...parent.object?.find(objectType) || []);
      });
    } else {
      array = this.pointers(objectType);
    }
    if (!array || array.length <= 0) return [];
    let result = [...array];
    for (const condition of conditions || []) {
      result = result.filter(condition);
    }
    return result;
  }


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