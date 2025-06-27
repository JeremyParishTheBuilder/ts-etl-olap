import NewPointer from './NewPointer.js';
import RegistryObject from './RegistryObject.js';
import Container from './Container.js';

class MultiRegistryRoot extends RegistryObject {

  private static instance: MultiRegistryRoot;

  public static getInstance(): MultiRegistryRoot {
    if (!this.instance) {
      this.instance = new MultiRegistryRoot();
    }
    return this.instance;
  }

  private constructor() {
    super(new NewPointer(null, -1, ""));
  }


  protected container(
    objectType: string = "RegistryRoot"
  ): Container | undefined {
    let container = this._containers.get(objectType);
    if (!container) {
      this._containers.set(objectType, new Container(objectType, ""));
      container = this._containers.get(objectType);
    }
    return container;
  }

  public set(
    objectType: string,
    key: string,
    object: RegistryObject
  ): RegistryObject | undefined {
    const container = this.container(objectType);
    if (!container) return undefined;
    container.set(key, object);
    return container.get(key) ?? undefined;
  }

  public get(
    objectType: string,
    key: string,
  ): RegistryObject | undefined {
    return this.container(objectType)?.get(key) ?? undefined;
  }

}

export default MultiRegistryRoot;