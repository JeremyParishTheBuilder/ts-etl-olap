import { type ValueResolver } from "./ValueResolver.js";

export class LambdaValueResolver implements ValueResolver {
  constructor(
    private readonly fn: (source: unknown) => unknown
  ) {}

  resolve(source: unknown): unknown {
    return this.fn(source);
  }
}