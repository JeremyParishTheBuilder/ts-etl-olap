import ChainRegistry from './ChainRegistry.js';
import { ChainFileName } from '../constants/ChainConstants.js';

export class Version {

  private _versionName: string;
  private _chainName: string;
  private _properties: Record<string, any> | null = null; // Stores JSON properties

  [key: string]: any;

  public constructor(chainName: string, versionName: string) {
    this._chainName = chainName;
    this._versionName = versionName;

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
    this._properties = ChainRegistry.getInstance().
      chain(this._chainName)?.
      file(ChainFileName.VERSIONS)?.
      contents?.
      versions?.
      find(
        (version: any) =>
          version.name === this._versionName
      ) ?? {};
  }

}

export default Version;