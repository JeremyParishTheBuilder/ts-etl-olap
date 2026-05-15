import { ENGINE_RULES } from "./EngineRules.js";

export type EnginePolicy = {
  [D in keyof typeof ENGINE_RULES]?: {
    [K in keyof typeof ENGINE_RULES[D]]?: typeof ENGINE_RULES[D][K]
  };
};

export function defaultPolicy(): EnginePolicy {
  const result: EnginePolicy = {};

  for (const domainKey in ENGINE_RULES) {
    result[domainKey] = {};
    const domain = ENGINE_RULES[domainKey];

    for (const ruleKey in domain) {
      const spec = domain[ruleKey];
      result[domainKey]![ruleKey] = spec.engineDefault;
    }
  }

  return result;
}