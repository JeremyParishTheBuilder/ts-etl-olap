import { Databases } from "../schema/Databases.js";

export interface Action {
  apply(databases: Databases): Databases;
}