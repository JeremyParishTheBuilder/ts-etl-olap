import { type ImportSourceResolver } from "./ImportSourceResolver.js";

export class IdentitySourceResolver implements ImportSourceResolver {
  resolve(source: unknown): unknown[] {
    return [source];
  }

  consumedKeys(): string[] {
    return [];
  }
}