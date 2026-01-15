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

// type RuleValue<D extends keyof typeof ENGINE_RULES, K extends keyof typeof ENGINE_RULES[D]> =
//   typeof ENGINE_RULES[D][K] extends { engineDefault: infer V } ? V : never;

// export interface EnginePolicy {
//   constraints?: {
//     validateExistingDataOnAdd?: boolean;
//     allowNullableForeignKeys?: boolean;
//     requireExplicitNames?: boolean;
//   };

//   typing?: {
//     allowImplicitWidening?: boolean;
//   };
//   transaction?: {
//     isolationLevel: "READ COMMITTED" | "REPEATABLE READ" | "SERIALIZABLE";
//     autoCommit?: boolean;
//     trackStatementHistory?: boolean;
//   };
// }

// export function defaultPolicyForDialect(
//   dialect: Dialect
// ): EnginePolicy {
//   const dialectRules = DIALECT_RULES[dialect]; 
//   return {
//     constraints: {
//       validateExistingDataOnAdd: true,
//       allowNullableForeignKeys:
//         dialectRules.constraints.allowNullableForeignKeys ?? true,
//       requireExplicitNames: false,
//     },
//     transaction: {
//       isolationLevel: dialectRules.constraints.allowNullableForeignKeys
//         ?? "READ COMMITTED",
//       autoCommit: true,
//       trackStatementHistory: true
//     },
//   } as EnginePolicy;
// }