import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

export const CONFIG = {

  CHAIN_REG_ROOT_DIR: process.env.CHAIN_REG_ROOT_DIR || "../",
  CHAIN_REG_DIR_NAME: process.env.CHAIN_REG_DIR_NAME || "chain-registry",

  //NON_COSMOS_DIR_NAME: "_non-cosmos",
  //TESTNETS_DIR_NAME: "testnets",
  //ASSETLIST_FILE_NAME: "assetlist.json",
  //CHAIN_FILE_NAME: "chain.json",
  //VERSIONS_FILE_NAME: "versions.json",
  IMAGES_DIR_NAME: "images",

  DEBUG: process.env.DEBUG === "true", // Convert string to boolean
};

if (CONFIG.DEBUG) {
  console.log("Config loaded:", CONFIG);
}
