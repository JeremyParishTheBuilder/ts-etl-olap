export class PersistentMap<K, V> {
  public map: Map<K, V> = new Map();

  protected clone(changes?: Partial<this>): this {
    const clone = Object.create(this.constructor.prototype) as this;

    clone.map = new Map(this.map);

    Object.assign(clone, changes);

    return clone;
  }

  public has(key: K): boolean {
    return this.map.has(key);
  }

  public requireHasNot(key: K): boolean {
    if (this.map.has(key)) {
      throw new Error(`${this.constructor.name}: key ${String(key)} already used`);
    }
    return true;
  }

  public get(key: K): V | undefined {
    return this.map.get(key);
  }

  public require(key: K): V {
    if (!this.map.has(key)) {
      throw new Error(`${this.constructor.name}: missing key ${String(key)}`);
    }
    return this.map.get(key)!;
  }

  public add(key: K, value: V): this {
    this.requireHasNot(key);
    
    const clone = this.clone();
    clone.map.set(key, value);
    return clone;
  }

  public update(key: K, value: V): this {
    if (this.map.has(key) && this.map.get(key) === value) {
      return this;
    }

    const clone = this.clone();
    clone.map.set(key, value);
    return clone;
  }

  public remove(key: K): this {
    if (!this.map.has(key)) {
      return this;
    }

    const clone = this.clone();
    clone.map.delete(key);
    return clone;
  }

  public some(fn: (value: V, key: K) => boolean): boolean {
    for (const [k, v] of this.map) {
      if (fn(v, k)) return true;
    }
    return false;
  }

  public filter(fn: (value: V, key: K) => boolean): this {
    const newMap = new Map<K, V>();

    for (const [k, v] of this.map) {
      if (fn(v, k)) {
        newMap.set(k, v);
      }
    }

    return this.clone({ map: newMap } as Partial<this>);
  }

  public values(): IterableIterator<V> {
    return this.map.values();
  }

  public forEach(fn: (value: V, key: K) => void): void {
    for (const [k, v] of this.map) {
      fn(v, k);
    }
  }

  public mapValues(
    callback: (value: V, key: K) => V
  ): this {
    let changed = false;

    const newMap = new Map<K, V>();

    for (const [key, value] of this.map) {
      const newValue = callback(value, key);

      if (newValue !== value) {
        changed = true;
      }

      newMap.set(key, newValue);
    }

    if (!changed) {
      return this;
    }

    return this.clone({ map: newMap } as Partial<this>);
  }
}
