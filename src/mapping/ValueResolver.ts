export interface ValueResolver {
  resolve(source: unknown): unknown;
}