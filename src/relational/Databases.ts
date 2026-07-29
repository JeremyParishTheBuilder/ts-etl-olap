import { Immutable } from "../infrastructure/Immutable.js";
import { Database, type DatabaseId } from "./Database.js";
import { NamedObjectStore } from "../infrastructure/NamedObjectStore.js";
import { IdAllocator } from "../types/IdAllocator.js";

export class Databases extends Immutable {
  public readonly databases: NamedObjectStore<Database, DatabaseId>;
  public readonly databaseIds: IdAllocator<DatabaseId>;

  public constructor() {
    super();

    this.databases = new NamedObjectStore();
    this.databaseIds = new IdAllocator();

    this.validate();
    this.seal();
  }

  public validate(): void {}

  public get(id: DatabaseId): Database | undefined {
    return this.databases.get(id);
  }

  public getByName(name: string): Database | undefined {
    return this.databases.getByName(name);
  }

  public require(id: DatabaseId): Database {
    return this.databases.require(id);
  }

  public requireByName(name: string): Database {
    return this.databases.requireByName(name);
  }

  public create(spec: { name: string }): Databases {
    this.databases.assertNameUnused(spec.name);

    const [id, databaseIds] = this.databaseIds.allocate();

    const database = Database.create({ ...spec, id });

    const updatedDatabases = this.databases.add(database);

    return this.with({
      databases: updatedDatabases,
      databaseIds,
    } as Partial<this>);
  }

  public add(database: Database): Databases {
    return this.with({
      databases: this.databases.add(database),
    } as Partial<this>);
  }

  public update(database: Database): Databases {
    return this.with({
      databases: this.databases.update(database),
    } as Partial<this>);
  }

  public remove(id: DatabaseId) {
    return this.with({
      databases: this.databases.remove(id),
    } as Partial<this>);
  }
}
