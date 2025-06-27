import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

export const CONFIG = {

  CHAIN_REG_ROOT_DIR: process.env.CHAIN_REG_ROOT_DIR || "../chain-registry",
  CHAIN_REG_DIR_NAME: process.env.CHAIN_REG_DIR_NAME || "chain-registry",

  IMAGES_DIR_NAME: "images",

  DEBUG: process.env.DEBUG === "true", // Convert string to boolean
};

if (CONFIG.DEBUG) {
  console.log("Config loaded:", CONFIG);
}

export default CONFIG;
