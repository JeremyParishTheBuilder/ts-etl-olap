export class ColumnSchema {
  constructor(
    readonly name: string,
    readonly observedTypes = new Set<string>(),
    public nullable = false
  ) {}

  observe(
    value: unknown
  ): void {
    this.observedTypes.add(
      typeof value
    );
  }
}