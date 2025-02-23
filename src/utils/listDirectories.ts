// src/utils/listDirectories.ts
import fs from 'fs';
import path from 'path';
import { Directory } from './Directory.js';
import { CONFIG } from '../config.js';

export const listDirectoryContents = (dir: string) => {
  try {
    const fullPath = path.resolve(dir);
    const files = fs.readdirSync(fullPath);
    console.log(`Contents of ${fullPath}:`);
    files.forEach((file) => {
      console.log(file);
    });
  } catch (error) {
    console.error('Error reading directory:', error);
  }
};

export const listChainRegContents = () => {
  const chainRegDir = path.join(CONFIG.CHAIN_REG_ROOT_DIR, CONFIG.CHAIN_REG_DIR_NAME);
  const chainRegDirectory = new Directory(chainRegDir);
  const contents = chainRegDirectory.contents();
  console.log(`Contents of ${chainRegDir}:`, contents);
};