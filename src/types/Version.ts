import Chain from './Chain.js';
import { ChainFileName } from '../constants/ChainConstants.js';

export class Version {

  private _versionName: string;
  private _chain: Chain;
  private _properties: Record<string, any> | null = null; // Stores JSON properties

  [key: string]: any;

  public constructor(chain: Chain, versionName: string) {
    this._versionName = versionName;
    this._chain = chain;

    return new Proxy(this, {
      get: (target, prop: string) => {
        if (prop in target) return (target as any)[prop];
        if (target._properties === null) {
          target.loadProperties();
        }
        return target._properties?.[prop] ?? undefined;
      },
    });
  }

  private loadProperties(): void {
    if (this._properties !== null) return;
    const versionsFile = this._chain.file(ChainFileName.VERSIONS);
    if (!versionsFile?.contents?.versions) {
      this._properties = {};
      return;
    }
    this._properties = versionsFile.contents.versions.find(
      (version: any) => version.name === this._versionName
    ) ?? {};
  }

}

export default Version;