import Pointer from './Pointer.js';

abstract class RegistryObject {

  protected _pointer: Pointer | undefined | null = null;
  public get pointer(): Pointer | undefined | null { return this._pointer; }
  public get key(): any { return this._pointer?.key; }
  public get parent(): any { return this._pointer?.parent; }

  constructor(pointer: Pointer | undefined, json: Record<string, any> | null = null) {
    this._pointer = pointer;
    this._jsonProperties = json; //optional json at construction (when not lazy loading)
  }

  protected loadProperties(): void {
    if (this._jsonProperties === null) this._jsonProperties = this.fetchJsonProperties() || {};
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