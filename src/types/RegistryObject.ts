abstract class RegistryObject {
  protected _jsonProperties: Record<string, any> | null = null;

  constructor(json: Record<string, any> | null = null) {
    this._jsonProperties = json; //optional json at construction (when not lazy loading)
  }

  // Lazy-load json properties
  protected loadProperties(): void {
    if (this._jsonProperties === null) this._jsonProperties = this.fetchJsonProperties() || {};
  }

  public property<T = any>(propertyName: string): T | undefined {
    if (this._jsonProperties === null) this.loadProperties();
    if (!this._jsonProperties) return undefined;
    return this._jsonProperties[propertyName] as T;
  }

  protected fetchJsonProperties(): Record<string, any> | null {
    return null; // Default to passed in param/null; subclasses should provide actual implementation
  }

  public toJSON(): any {
    if (this._jsonProperties === null) this.loadProperties();
    return { ...this._jsonProperties };
  }

  public print(): void {
    console.log(this.toJSON());
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