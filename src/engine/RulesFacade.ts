import type { RuleResolver } from "./RuleResolver.js";
import { ENGINE_RULES } from "./EngineRules.js";

export type RulesFacadeShape = {
  [D in keyof typeof ENGINE_RULES]: {
    [K in keyof typeof ENGINE_RULES[D]]: typeof ENGINE_RULES[D][K]["engineDefault"];
  };
};

export const RulesFacade = (resolver: RuleResolver): RulesFacadeShape =>
  new Proxy(
      {},
      {
        get: (_, domain: keyof typeof ENGINE_RULES) => {
          if (!(domain in ENGINE_RULES)) return undefined;

          return new Proxy(
            {},
            {
              get: (_, rule: keyof typeof ENGINE_RULES[typeof domain]) =>
                resolver.get(domain, rule),
            }
          );
        },
      }
    ) as RulesFacadeShape;