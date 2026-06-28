//export type DerivedValueResolver = (source: unknown) => unknown;

export interface SingleValueResolver {
  resolve(source: unknown): unknown;
}