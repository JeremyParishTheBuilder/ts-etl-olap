import path from 'path';

export class DirectoryContent {
  protected _fullPath: string;
  protected _basename: string;
  protected constructor(fullPath: string) {
    this._fullPath = fullPath;
    this._basename = path.basename(fullPath);
  }
  get basename(): string {
    return this._basename;
  }
  get fullPath(): string {
    return this._fullPath;
  }
}

export default DirectoryContent;