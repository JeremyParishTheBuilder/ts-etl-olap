// import RegistryObject from "./RegistryObject.js";

// class RegistryStructureEntry<
//   K = string | number, // Key type
//   E = any // Element type being iterated over
//   > {
//   constructor(
//     public type: string,
//     public keyPrototype: K,
//     public parentType: string | null,
//     public elementsArray: (parent: RegistryObject) => E[],
//     public extractKey: ((element: E) => K) | null,
//     public extractJson: (element: E) => any,
//     public overrideProperties?: Map<string, ((element: E, arg?: any) => any)> | null,
//     public derivedProperties?: Map<string, ((element: E, arg?: any) => any)> | null,
//     public argsProperty?: (element: E, propertyName: string, args?: any) => any | null,
//     public defaultArgs?: any | null
//   ) { }

//   public getKeys(parent: RegistryObject): K[] {

//     if (this.extractKey === null) return [];
//     const elements: E[] = this.elementsArray(parent);
//     if (!elements || elements.length <= 0) return [];

//     return elements.map(this.extractKey);

//   }

//   public getSize(parent: RegistryObject): number {
//     return this.elementsArray(parent).length;
//   }

//   public fetchJsonProperties(parent: RegistryObject, key: K): any | undefined {
//     const elements = this.elementsArray(parent);
//     if (!elements) return undefined;
//     if (typeof key === "number") {
//       if (key >= 0 && key < elements.length) {
//         return this.extractJson(elements[key]);
//       } else {
//         return undefined;
//       }
//     } else {
//       const element = elements.find(el => this.extractKey!(el) === key);
//       return element ? this.extractJson(element) : undefined;
//     }
//   }

// }

// export default RegistryStructureEntry;
