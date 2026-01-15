import { EngineContext } from "../engine/EngineContext.js";

export interface Action {
  apply(ctx: EngineContext): void;
}