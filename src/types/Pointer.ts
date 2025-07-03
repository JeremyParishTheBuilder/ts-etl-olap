import RegistryObject from './RegistryObject.js';
import MultiRegistryRoot from "./MultiRegistryRoot.js"

class Pointer {
  private _parent: Pointer | null;

  constructor(
    parent: Pointer | null,
    public readonly key: string | number,
    public readonly objectType: string
  ) {
    this._parent = parent;
  }

  get parent(): Pointer | null {
    return this._parent;
  }

  get object(): RegistryObject | undefined {
    if (this._parent === null) {
      return MultiRegistryRoot.getInstance();
    }

    return this.parent?.object?.get(
      this.objectType,
      this.key
    );
  }

  get root(): any {
    let current: Pointer = this;
    while (current._parent && current?._parent?._parent) {
      current = current.parent!;
    }
    return current;
  }
}

export default Pointer;