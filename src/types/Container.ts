import RegistryObject from './RegistryObject.js';
import NewPointer from './NewPointer.js';

class Container<T extends RegistryObject> {

  public readonly _objectType: new (...args: any[]) => T;
  private _keyType: StringConstructor | NumberConstructor;
  private _container: Map<string, T | null> | Array<T | null>;

  constructor(objectType: new (...args: any[]) => T) {
    this._objectType = objectType;
    const tempInstance = new objectType(null as any, null as any);
    this._keyType = tempInstance.keyType;
    if (typeof this._keyType === "string") {
      this._container = new Map();
    } else if (typeof this._keyType === "number") {
      this._container = new Array;
    } else {
      throw new Error(`"Unsupported key type: ${this._keyType} for objectType: ${this._objectType}"`);
    }
  }

  public get(key: string | number): T | null | undefined {
    if (this._container instanceof Map) {
      return this._container.get(String(key));
    } else if (Array.isArray(this._container)) {
      //console.log("is array");
      return this._container[key as number];
    } else {
      //console.log("is neither");
      //console.log(this._container);
      return undefined;
    }
  }

  public set(key: string | number, value: T | null): boolean {
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

  public values(): (T | null)[] {
    if (this._container instanceof Map) {
      return Array.from(this._container.values());
    } else {
      return this._container;
    }
  }

  /*public values(): (T | null)[] {
    let array: (T | null)[] = [];
    if (this._container instanceof Map) {
      array = Array.from(this._container.values());
    } else {
      array = this._container;
    }
    for (let i = 0; i < array.length; ++i) {
      if (array[i] === null) {
        array[i] = new T(i);
      }
    }
    return array;
  }*/

  public pointers(): Array<NewPointer<T>> {
    return this.values()
      .filter((obj): obj is T => obj !== null)
      .map(obj => obj.pointer);
  }

}

export default Container;