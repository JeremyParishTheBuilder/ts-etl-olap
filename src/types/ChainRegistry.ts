import path from "path";
import { Directory } from "../types/Directory.js";
import { CONFIG } from "../config.js";

export enum NetworkType {
  MAINNETS = "mainnets",
  TESTNETS = "testnets"
}

export enum ChainType {
  COSMOS = "cosmos",
  NON_COSMOS = "non-cosmos"
}

export enum JsonFileName {
  assetlist = "assetlist.json",
  chain = "chain.json",
  versions = "versions.json"
}

class ChainRegistry {

  private static instance: ChainRegistry | null = null;

  private chainRegDirectory: Directory | null = null;
  private testnetsDirectory: Directory | null = null;
  private nonCosmosMainnetsDirectory: Directory | null = null;
  private nonCosmosTestnetsDirectory: Directory | null = null;

  private static NON_COSMOS_DIR_NAME = "_non-cosmos";
  private static TESTNETS_DIR_NAME = "testnets";

  private static IMAGES_DIR_NAME = "images";

  private constructor() {
    this.chainRegDirectory = new Directory(path.join(
      CONFIG.CHAIN_REG_ROOT_DIR, CONFIG.CHAIN_REG_DIR_NAME));
    this.testnetsDirectory = new Directory(path.join(
      CONFIG.CHAIN_REG_ROOT_DIR, CONFIG.CHAIN_REG_DIR_NAME,
      ChainRegistry.TESTNETS_DIR_NAME));
    this.nonCosmosMainnetsDirectory = new Directory(path.join(
      CONFIG.CHAIN_REG_ROOT_DIR, CONFIG.CHAIN_REG_DIR_NAME,
      ChainRegistry.NON_COSMOS_DIR_NAME));
    this.nonCosmosTestnetsDirectory = new Directory(path.join(
      CONFIG.CHAIN_REG_ROOT_DIR, CONFIG.CHAIN_REG_DIR_NAME,
      ChainRegistry.TESTNETS_DIR_NAME, ChainRegistry.NON_COSMOS_DIR_NAME));
  }

  // Singleton pattern: Only creates the instance once
  public static getInstance(): ChainRegistry {
    if (!this.instance) {
      this.instance = new ChainRegistry();
    }
    return this.instance;
  }

  public getNetworksDirectory(
    networkType: NetworkType = NetworkType.MAINNETS,
    chainType: ChainType = ChainType.COSMOS
  ): Directory | null {
    if (networkType === NetworkType.MAINNETS) {
      return chainType === ChainType.COSMOS
        ? this.chainRegDirectory
        : this.nonCosmosMainnetsDirectory;
    }
    if (networkType === NetworkType.TESTNETS) {
      return chainType === ChainType.COSMOS
        ? this.testnetsDirectory
        : this.nonCosmosTestnetsDirectory;
    }
    return null;
  }

  public getFileProperty(fileName: JsonFileName): void {
    console.log("LOL");
    console.log(fileName);
  }

}

export default ChainRegistry;
