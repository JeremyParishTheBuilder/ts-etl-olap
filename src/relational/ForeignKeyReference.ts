import { type ForeignKey } from "./ForeignKey.js";

export type ForeignKeyReference = {
  tableName: string;
  foreignKey: ForeignKey;
};
