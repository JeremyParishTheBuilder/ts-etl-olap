// src/types/Directory.ts
import fs from 'fs';
import path from 'path';

export class Directory {
  // Define properties of the directory
  path: string;

  constructor(path: string) {
    this.path = path;
  }

  // Method to get contents of the directory
  contents(): string[] {
    try {
      const fullPath = path.resolve(this.path);  // Resolve to an absolute path
      const files = fs.readdirSync(fullPath);  // Get list of files

      // Return the list of file names
      return files;
    } catch (error) {
      console.error('Error reading directory:', error);
      return [];  // Return empty array if there's an error
    }
  }
}
