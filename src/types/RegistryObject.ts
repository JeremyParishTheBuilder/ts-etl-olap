abstract class RegistryObject {
  protected _jsonProperties: Record<string, any> | null = null;
  protected _properties: Record<string, any> | null = null; //all jsonProperties plus any other derived properties

  constructor(json: Record<string, any> | null = null) {
    this._jsonProperties = json;
  }

  // Lazy-load json properties
  protected loadProperties(): void {
    if (this._jsonProperties === null)
      this._jsonProperties = this.fetchJsonProperties() || {};
    this._properties = { ...this._jsonProperties };
  }

  public property<T = any>(propertyName: string): T | undefined {
    if (this._properties === null) this.loadProperties();
    if (!this._properties) return undefined;
    return this._properties[propertyName] as T;
  }

  // Fetch JSON data - meant to be overridden by subclasses
  protected fetchJsonProperties(): Record<string, any> | null {
    return null; // Default to passed in param/null; subclasses should provide actual implementation
  }

  public toJSON(): any {
    if (this._jsonProperties === null) this.loadProperties();
    return { ...this._jsonProperties };
  }

  public static arrayToJson(registryObjectArray: Array<RegistryObject>): Record<string, any> | undefined {
    let jsonArray: any[] = [];
    registryObjectArray.forEach(registryObject => {
      jsonArray.push(registryObject.toJSON());
    });
    return jsonArray.length ? jsonArray : undefined;
  }

  public print(): void {
    console.log(this.toJSON());
  }

}

export default RegistryObject;