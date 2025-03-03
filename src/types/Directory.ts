import fs from 'fs';
import path from 'path';
import File from './File.js';
import DirectoryContent from './DirectoryContent.js';
import { ChainFileName } from '../constants/ChainConstants.js';

export class Directory extends DirectoryContent  {

  private _contents: (Directory | File)[] | null = null;
  private _isChain: boolean | null = null;

  constructor(fullPath: string) {
    super(fullPath);
  }

  reclassify<T extends Directory>(newType: T): T {
    Object.assign(newType, this); // Copies properties from this Directory to newType
    return newType;
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

  public find<T extends DirectoryContent>(
    basename: string,
    contentType: new (...args: any[]) => T
  ): T | undefined {
    return this.contents.find(
      (content) => content instanceof contentType && content.basename === basename
    ) as T | undefined;
  }

  public get isChain(): boolean {
    if (this._isChain !== null) {
      return this._isChain;
    }
    const contents = this.contents;
    this._isChain = contents.some(
      (entry) => entry instanceof File && (entry.basename === ChainFileName.ASSETLIST || entry.basename === ChainFileName.CHAIN)
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