abstract class Pointer {
  constructor(
    protected _parent: Pointer | undefined,
    protected _key: any
  ) { }
  public get parent(): Pointer | undefined { return this._parent; }
  public get key(): any { return this._key; }
}

export default Pointer;