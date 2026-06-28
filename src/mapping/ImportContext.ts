export class ImportContext {
  constructor(
    readonly captures: Map<string, unknown>
  ) {}

  withCapture(
    name: string,
    value: unknown
  ): ImportContext {
    return new ImportContext(
      new Map([
        ...this.captures,
        [name, value]
      ])
    );
  }
}