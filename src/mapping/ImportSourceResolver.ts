export interface ImportSourceResolver {
  resolve(source: unknown): unknown;
  consumedKeys(): string[];
}