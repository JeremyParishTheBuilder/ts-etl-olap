import RegistryObject from "./RegistryObject";
import FsStructureEntry from './FsStructureEntry.js';


class RegistryStructureEntry<
  T extends RegistryObject, // RegistryObject type
  P extends RegistryObject, // Parent RegistryObject type
  K = string | number, // Key type
  E = any // Element type being iterated over
  > {
  constructor(
    public type: new (...args: any[]) => T, 
    public keyPrototype: K,
    public parentType: (new (...args: any[]) => P) | null,
    public elementsArray: (parent: P) => E[],
    public extractKey: ((element: E) => K) | null,
    public extractJson: (element: E) => any
  ) { }

  public getKeys(parent: P): K[] {

    if (this.extractKey === null) return [];
    const elements: E[] = this.elementsArray(parent);
    if (!elements || elements.length <= 0) return [];
    
    return elements.map(this.extractKey);

  }

  public getSize(parent: P): number {
    return this.elementsArray(parent).length;
  }

  /*public fetchJsonProperties(parent: P, key: K): any | undefined {
    if (K typeof number && getKeys(parent) typeof number && K < getKeys(parent)) return this.extractJson(this.elementsArray(parent)[i]);
    const element = this.elementsArray(parent).find(el => this.getKey(el) === key);
    return element ? this.extractJson(element) : undefined;
  }*/

  public fetchJsonProperties(parent: P, key: K): any | undefined {
    /*console.log("trying to fetch!");
    console.log("fetchJsonProperties() Parent:");
    console.log(parent);
    console.log("fetchJsonProperties() Key:");
    console.log(key);
    console.log("typeof key")
    console.log(typeof key);*/
    const elements = this.elementsArray(parent);
    //console.log(elements?.length);
    
    if (!elements) return undefined;
    if (typeof key === "number") {
      //console.log("found a number key!");
      if (key >= 0 && key < elements.length) {
        return this.extractJson(elements[key]);
      } else {
        return undefined;
      }
    } else {
      const element = elements.find(el => this.extractKey!(el) === key);
      return element ? this.extractJson(element) : undefined;
    }
  }

}

export default RegistryStructureEntry;