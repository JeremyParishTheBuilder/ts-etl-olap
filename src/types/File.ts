import path from 'path';

export class File {
  fullPath: string;
  basename: string;

  constructor(fullPath: string) {
    this.fullPath = fullPath;
    this.basename = path.basename(fullPath);
  }

}
