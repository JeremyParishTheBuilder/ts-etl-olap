import { Databases } from "../relational/Databases.js";

export interface Action {
  apply(databases: Databases): Databases;
}