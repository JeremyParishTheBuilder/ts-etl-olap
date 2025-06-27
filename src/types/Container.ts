import RegistryObject from './RegistryObject.js';
import NewPointer from './NewPointer.js';

class Container {

  //public readonly _objectType: string;
  //private _keyType: string | number;
  private _container: Map<string, RegistryObject | null> | Array<RegistryObject | null>;

  constructor(objectType: string, key: string | number) {
    //this._objectType = objectType;
    //const tempInstance = new RegistryObject(null as any, null as any);
    //this._keyType = tempInstance.getKeyType(objectType);
    //this._keyType = keyType;
    /*console.log("Creating Container");
    console.log("objectType:");
    console.log(objectType);
    console.log("key");
    console.log(key);*/
    if (typeof key === "string") {
      this._container = new Map();
    } else if (typeof key === "number") {
      this._container = new Array;
    } else {
      throw new Error(`"Unsupported key type: ${typeof key} for objectType: ${objectType}"`);
    }
    //console.log("Done!");
  }

  public get(key: string | number): RegistryObject | null | undefined {
    if (this._container instanceof Map) {
      return this._container.get(String(key));
    } else if (Array.isArray(this._container)) {
      return this._container[key as number];
    } else {
      return undefined;
    }
  }

  public set(key: string | number, value: RegistryObject | null): boolean {
    if (this._container instanceof Map) {
      this._container.set(String(key), value);
      return true;
    } else if (Array.isArray(this._container)) {
      this._container[key as number] = value;
      return true;
    } else {
      return false;
    }
  }

  public init(keys: string[] | number): void {
    if (this._container instanceof Array && typeof keys === "number") {
      for (let i = 0; i < keys; ++i) {
        this.set(i, null);
      }
    }
    if (this._container instanceof Map && typeof keys !== "number") {
      for (const key of keys) {
        this.set(key, null);
      }
    }
  }

  public keys(): (string | number)[] {
    if (this._container instanceof Map) {
      return [...this._container.keys()];
    } else if (Array.isArray(this._container)) {
      return this._container.map((_, idx) => idx);
    }
    return [];
  }

  public values(): (RegistryObject | null)[] {
    if (this._container instanceof Map) {
      return Array.from(this._container.values());
    } else {
      return this._container;
    }
  }

  public pointers(): Array<NewPointer> {
    return this.values()
      .filter((obj): obj is RegistryObject => obj !== null)
      .map(obj => obj.pointer);
  }

}

export default Container;