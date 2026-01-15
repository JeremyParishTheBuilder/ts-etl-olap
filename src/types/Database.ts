import { Table } from '../types/Table.js';

export class Database {
  public tables = new Map<string, Table>();

  constructor(public name: string) {}

  public clone() {
    return new Database(this.name);
  }

  createTable(
    name: string
  ) {
    if (this.tables.has(name)) {
      throw new Error(`Table ${name} already exists`);
    }

    this.tables.set(name, new Table(name));
  }
}

export default Database;