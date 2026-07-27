import type { EnginePolicy } from "./EnginePolicy.js";
import { ENGINE_RULES } from "./EngineRules.js";
import type { Dialect } from "../dialect/Dialect.js";

export class RuleResolver {
  private cache = new Map<string, unknown>();

  constructor(
    private dialect: Dialect,
    private policy: Partial<EnginePolicy>,
  ) {}

  get<D extends keyof typeof ENGINE_RULES, K extends keyof typeof ENGINE_RULES[D]>(
    domain: D,
    rule: K
  ): typeof ENGINE_RULES[D][K]['engineDefault'] {
    const cacheKey = `${domain}.${String(rule)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as typeof ENGINE_RULES[D][K]['engineDefault'];
    }

    const spec = ENGINE_RULES[domain][rule];

    const value: typeof spec.engineDefault =
      spec.dialectStrict?.(this.dialect) ?? 
      (this.policy?.[domain] as Record<typeof rule, typeof spec.engineDefault>)?.[rule] ??
      spec.dialectDefault?.(this.dialect) ??
      spec.engineDefault;

    this.cache.set(cacheKey, value);
    return value;
  }

  updatePolicy(update: Partial<EnginePolicy>) {
    // shallow merge the update into the current policy
    this.policy = {
      ...this.policy,
      ...update
    };
    this.invalidate();  // clear cache so get() recomputes
  }

  invalidate() {
    this.cache.clear();
  }
}