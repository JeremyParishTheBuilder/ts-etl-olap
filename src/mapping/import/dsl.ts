import { DiscoveryImportSource } from "./DiscoveryImportSource.js";
import type { ImportSource } from "./ImportSource.js";
import { PathImportSource } from "./PathImportSource.js";
import { PropertyPath } from "./PropertyPath.js";

export function discovery(
  nodeType: string
): ImportSource {
  return new DiscoveryImportSource(
    nodeType
  );
}

export function path(
  path: string
): ImportSource {
  return new PathImportSource(path);
}