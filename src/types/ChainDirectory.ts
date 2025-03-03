import Directory from './Directory.js';
import File from './File.js';
import { ChainFileName, ChainDirName } from '../constants/ChainConstants.js';

class ChainDirectory extends Directory {

  private _keyFiles: Map<ChainFileName, File | undefined> = new Map(); //Stores Files like: Assetlist, Chain & Versions.
  private _keyDirectories: Map<ChainDirName, Directory | undefined> = new Map(); //Stores Directories like: /images/.

  constructor(directory: Directory) {
    super(directory.fullPath);
  }

  public file(name: ChainFileName): File | undefined {
    if (!this._keyFiles.has(name)) {
      this._keyFiles.set(name, this.find(name, File)); // Find the file within the directory
    }
    return this._keyFiles.get(name);
  }

  public directory(name: ChainDirName): Directory | undefined {
    if (!this._keyDirectories.has(name)) {
      this._keyDirectories.set(name, this.find(name, Directory)); // Find the directory within the selfDir
    }
    return this._keyDirectories.get(name);
  }

}

export default ChainDirectory;