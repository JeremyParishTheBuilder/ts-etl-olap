export abstract class Immutable {
  protected abstract validate(): void;

  protected with(changes?: Partial<this>): this {
    if (!changes) return this;

    for (const key of Object.keys(changes) as (keyof this)[]) {
      if (changes[key] !== this[key]) {
        return this.clone(changes);
      }
    }

    return this;
  }

  private clone(changes?: Partial<this>): this {
    const clone = Object.create(
      this.constructor.prototype
    ) as this;

    Object.assign(clone, this, changes);

    (clone as Immutable).afterClone(clone);

    clone.validate();

    return clone.seal();
  }

  protected afterClone(_instance: this): void {} // hook

  protected seal(): this {
    return Object.freeze(this);
  }
}