import { PersistentMap } from "../infrastructure/PersistentMap.js";
import { Immutable } from "../infrastructure/Immutable.js";
import { Database } from "./Database.js";
import { normalizeIdentifier } from "../utils/normalizeIdentifier.js";

export class Databases extends Immutable {
  public databases: PersistentMap<string, Database> = new PersistentMap();

  public constructor() {
    super();
    this.validate();
    this.seal();
  }

  public validate(): void {}

  public get(name: string): Database | undefined {
    return this.databases.get(normalizeIdentifier(name));
  }

  public require(name: string): Database {
    const database: Database | undefined = this.get(name);
    if (!database) throw new Error(`Database '${name ?? "unknown"}' not found`);
    return database;
  }

  public create(name: string): Databases {
    return this.add(new Database(name));
  }

  public add(database: Database): Databases {
    return this.with({
      databases: this.databases.add(normalizeIdentifier(database.name), database),
    } as Partial<this>);
  }

  public update(database: Database): Databases {
    return this.with({
      databases: this.databases.update(normalizeIdentifier(database.name), database)
    } as Partial<this>);
  }

  public remove(name: string) {
    return this.with({
      databases: this.databases.remove(normalizeIdentifier(name)),
    } as Partial<this>);
  }
}