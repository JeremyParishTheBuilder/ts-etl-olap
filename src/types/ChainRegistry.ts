import path from "path";
import Chain from '../types/Chain.js';
import Asset from '../types/Asset.js';
import Version from '../types/Version.js';
import Directory from '../types/Directory.js';
import CONFIG from '../config.js';
import NewPointer from './NewPointer.js';
import IbcConnection from './IbcConnection.js';
import IbcChannel from './IbcChannel.js';
import File from './File.js';
import RegistryObject from './RegistryObject.js';
import RegistryStructureEntry from './RegistryStructureEntry.js';

class ChainRegistry extends RegistryObject {


  public keyType = typeof null;

  private static instance: ChainRegistry | null = null;

  public static getInstance(
    registryStructureMap?: Map<
      new (...args: any[]) => RegistryObject,
      RegistryStructureEntry<RegistryObject, RegistryObject, string | number, any>
    >
  ): ChainRegistry {
    if (!this.instance) {
      if (!registryStructureMap) {
        throw new Error("ChainRegistry.getInstance() requires a structure map on first call.");
      }
      this.instance = new ChainRegistry(registryStructureMap);
    }
    return this.instance;
  }

  public constructor(
    protected registryStructureMap: Map<
      new (...args: any[]) => RegistryObject,
      RegistryStructureEntry<RegistryObject, RegistryObject, string | number, any>
    >
  ) {
    super(new NewPointer(ChainRegistry, null, null));
  }


  public override find<T extends RegistryObject>(
    objectType: new (...args: any[]) => T,
    conditions?: Array<(pointer: NewPointer<T>) => boolean>
  ): NewPointer<T>[] {
    if (objectType === Asset as unknown as new (...args: any[]) => T) {
      let chains = this.find(Chain);
      const results: NewPointer<T>[] = [];
      for (const chainPointer of chains) {
        const chain = chainPointer.object;
        if (!chain) continue;
        const nestedResults = chain.find(objectType, conditions);
        results.push(...nestedResults);
      }
      return results;
    }
    return super.find(objectType, conditions);
  }


}

export default ChainRegistry;