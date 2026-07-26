import { type Action } from "./Action.js";
import { type Databases } from "../relational/Databases.js";

export class CreateDatabaseAction implements Action {
  constructor(
    private name: string,
  ) {}

  apply(databases: Databases): Databases {
    return databases.create({name: this.name});
  }
}