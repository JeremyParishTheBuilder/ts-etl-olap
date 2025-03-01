import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config.js';
import File from './File.js';
import DirectoryContent from './DirectoryContent.js';
import { JsonFileName } from './ChainRegistry.js';

export class Directory extends DirectoryContent  {

  private _contents: (Directory | File)[] | null = null;
  private _isChain: boolean | null = null;

  constructor(fullPath: string) {
    super(fullPath);
  }

  private readContents(): void {
    try {
      const entries = fs.readdirSync(this.fullPath);
      this._contents = entries.map((entry) => {
        const fullPath = path.join(this.fullPath, entry);
        const stat = fs.lstatSync(fullPath);
        return stat.isDirectory() ? new Directory(fullPath) : new File(fullPath);
      });
    } catch (error) {
      console.error('Error reading directory:', error);
      this._contents = [];
    }
  }

  public get contents(): (Directory | File)[] {
    if (this._contents === null) {
      this.readContents();
    }
    return this._contents!;
  }

  public get isChain(): boolean {
    if (this._isChain !== null) {
      return this._isChain;
    }
    const contents = this.contents;
    this._isChain = contents.some(
      (entry) => entry instanceof File && (entry.basename === JsonFileName.ASSETLIST || entry.basename === JsonFileName.CHAIN)
    );
    return this._isChain;
  }

  // Method to log the cached contents to the console
  public logContents(): void {
    const contents = this.contents;  // Automatically loads contents if not loaded
    console.log(`Contents of directory ${this.fullPath}:`);

    if (contents.length) {
      contents.forEach((content) => {
        console.log(content);  // Display each entry
      });
    } else {
      console.log("No contents found or error occurred while reading.");
    }
  }

}

export default Directory;