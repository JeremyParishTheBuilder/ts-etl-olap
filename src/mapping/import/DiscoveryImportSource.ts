import { toPascalCase } from "../../utils/format.js";
import { ImportContext } from "./ImportContext.js";
import type { ImportSource } from "./ImportSource.js";

export class DiscoveryImportSource implements ImportSource {
  constructor(readonly nodeType: string) {}

  navigate(context: ImportContext): ImportContext[] {
    return context.discovery.children
      .filter((child) => child.resultType === this.nodeType)
      .map((child) => context.withDiscovery(child));
  }

  consumedKeys(): readonly string[] {
    return [];
  }

  columnNamespace(): string | undefined {
    return toPascalCase(this.nodeType);
  }
}
