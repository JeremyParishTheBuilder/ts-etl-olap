import { Validator } from "./Validator.js";
import type { Resolver } from "./Resolver.js";
//import { ResolvedRules } from "./ResolvedRules";
import type { RulesFacadeShape } from "./RulesFacade.js";

export class EngineContext {
  public validate = new Validator(this);
  constructor(
    public readonly resolver: Resolver,
    public readonly rules: RulesFacadeShape,
    public readonly txId: number
  ) {}

  // get resolver() {
  //   return this.engine.resolver;
  // }

  // get rules() {
  //   return this.engine.rules;
  // }
}