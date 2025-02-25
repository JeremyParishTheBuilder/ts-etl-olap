// src/types/Directory.ts
import fs from 'fs';
import path from 'path';
import { File } from './File.js';

export class Directory {
  fullPath: string;
  private contentsCache: (Directory | File)[] | null = null;
  private isChain: boolean | null = null;

  constructor(fullPath: string) {
    this.fullPath = fullPath;
  }

  private readContents(): void {
    try {
      const entries = fs.readdirSync(this.fullPath);
      this.contentsCache = entries.map((entry) => {
        const fullPath = path.join(this.fullPath, entry);
        const stat = fs.lstatSync(fullPath);
        return stat.isDirectory() ? new Directory(fullPath) : new File(fullPath);
      });
    } catch (error) {
      console.error('Error reading directory:', error);
      this.contentsCache = [];
    }
  }

  public contents(): (Directory | File)[] {
    if (this.contentsCache === null) {
      this.readContents();
    }
    return this.contentsCache!;
  }

  public isChainDirectory(): boolean {
    if (this.isChain !== null) {
      return this.isChain;
    }
    const contents = this.contents();
    this.isChain = contents.some(
      (entry) => entry instanceof File && (entry.basename === "assetlist.json" || entry.basename === "chain.json")
    );
    return this.isChain;
  }

  // Method to log the cached contents to the console
  public logContents(): void {
    const contents = this.contents();  // Automatically loads contents if not loaded
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
