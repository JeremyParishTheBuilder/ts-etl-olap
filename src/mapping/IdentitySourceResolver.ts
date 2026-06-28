import { type ImportSourceResolver } from "./ImportSourceResolver.js";

export class IdentitySourceResolver implements ImportSourceResolver {
  resolveMany(source: unknown): unknown[] {
    return [source];
  }

  resolveFirst(source: unknown): unknown {
    return source;
  }

  consumedKeys(): string[] {
    return [];
  }
}