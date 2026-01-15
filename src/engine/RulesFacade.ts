import type { RuleResolver } from "./RuleResolver.js";
import { ENGINE_RULES } from "./EngineRules.js";

//type EngineRules = typeof ENGINE_RULES;

// export class RulesFacade {
//   constructor(private resolver: RuleResolver) {}

//   ddl = {
//     supportsInlineForeignKeys: () =>
//       this.resolver.get("ddl", "supportsInlineForeignKeys"),
//   };

//   constraints = {
//     allowNullableForeignKeys: () =>
//       this.resolver.get("constraints", "allowNullableForeignKeys"),

//     requireExplicitNames: () =>
//       this.resolver.get("constraints", "requireExplicitNames"),
//   };

//   transaction = {
//     isolationLevel: () =>
//       this.resolver.get("transaction", "isolationLevel"),

//     autoCommit: () =>
//       this.resolver.get("transaction", "autoCommit"),

//     trackStatementHistory: () =>
//       this.resolver.get("transaction", "trackStatementHistory"),
//   };
// }

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