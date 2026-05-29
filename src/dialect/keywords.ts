export const DEFAULT = Symbol("DEFAULT");
export const CURRENT_TIMESTAMP = Symbol("CURRENT_TIMESTAMP");
export const CURRENT_DATE = Symbol("CURRENT_DATE");
export const CURRENT_TIME = Symbol("CURRENT_TIME");
export const NOW = Symbol("NOW");
export const GETDATE = Symbol("GETDATE");

export type Keyword =
  | typeof DEFAULT
  | typeof CURRENT_TIMESTAMP
  | typeof CURRENT_DATE
  | typeof CURRENT_TIME
  | typeof NOW
  | typeof GETDATE;