import { type Action } from "./Action.js";
import { type Databases } from "../schema/Databases.js";

export class CreateDatabaseAction implements Action {
  constructor(
    private name: string,
  ) {}

  apply(databases: Databases): Databases {
    return databases.create(this.name);
  }
}