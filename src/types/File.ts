import { DirectoryContent } from './DirectoryContent.js';

export class File extends DirectoryContent {
  constructor(fullPath: string) {
    super(fullPath);
  }

  /*
  public isSchemaJson(fileName: JsonFileName): void {
    console.log("LOL");
    console.log(fileName);
  }
  */

}
