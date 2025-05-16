import RegistryObject from './RegistryObject.js';

class NewPointer<T extends RegistryObject> {
  private _parent: NewPointer<RegistryObject> | null;
  private _key: InstanceType<T["keyType"]>;

  constructor(
    private objectType: { getInstance?: () => T } | (new (...args: any[]) => T),
    parent: NewPointer<RegistryObject> | null,
    key: InstanceType<T["keyType"]>
  ) {
    this._parent = parent;
    this._key = key;
  }

  get parent(): NewPointer<RegistryObject> {
    return this._parent ?? this;
  }

  get key(): InstanceType<T["keyType"]> {
    return this._key;
  }

  get object(): RegistryObject | undefined {
    if ("getInstance" in this.objectType && typeof this.objectType.getInstance === "function") {
      return this.objectType.getInstance();
    }
    return this.parent?.object?.get(
      this.objectType as new (...args: any[]) => RegistryObject,
      this.key
    );
  }

  get root(): any {
    let current: NewPointer<RegistryObject> = this;
    while (current._parent) {
      current = current._parent;
    }
    return current;
  }
}

export default NewPointer;