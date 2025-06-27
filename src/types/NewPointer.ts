import RegistryObject from './RegistryObject.js';
import RegistryRoot from "./MultiRegistryRoot.js"
import MultiRegistryRoot from "./MultiRegistryRoot.js"

class NewPointer {
  private _parent: NewPointer | null;
  //private _key: string | number;
  //private _type: string;

  constructor(
    parent: NewPointer | null,
    public readonly key: string | number,
    public readonly objectType: string
  ) {
    this._parent = parent;
    //this._key = key;
    //this._type = type;
  }

  get parent(): NewPointer | null {
    return this._parent;// ?? MultiRegistryRoot.getInstance().pointer;
  }
  /*
  get type(): string {
    return this._type;
  }

  get key(): string | number {
    return this._key;
  }*/

  get object(): RegistryObject | undefined {
    //console.log("Called get object() on Pointer");
    //console.log("this.parent");
    //console.log(this._parent);
    if (this._parent === null) {
      return MultiRegistryRoot.getInstance();
    }

    //console.log("this.parent.object");
    //console.log(this.parent?.object);
    //console.log("this.parent.object.get");
    //console.log(this.parent?.object?.get(
      //this.objectType,
      //this.key
    //));
    //console.log("now actually returning");
    return this.parent?.object?.get(
      this.objectType,
      this.key
    );
  }

  /*get object(): RegistryObject | undefined {
    if ("getInstance" in this.objectType && typeof this.objectType.getInstance === "function") {
      return this.objectType.getInstance();
    }
    return this.parent?.object?.get(
      this.objectType as new (...args: any[]) => RegistryObject,
      this.key
    );
  }*/

  /*get root(): NewPointer {
    return MultiRegistryRoot.getInstance().pointer;
  }*/

  get root(): any {
    //onsole.log("get Root()");
    //console.log(this.objectType);
    let current: NewPointer = this;
    while (current._parent && current?._parent?._parent) {
      current = current.parent!;
    }
    //console.log("current");
    //console.log(current);
    return current;
  }
}

export default NewPointer;