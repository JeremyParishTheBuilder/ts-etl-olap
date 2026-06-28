export interface ImportSourceResolver {
  resolveMany(source: unknown): unknown[];
  consumedKeys(): string[];
}