import type { DiscoveryResult, DiscoveryResultId } from "./DiscoveryResult.js";

export class DiscoveryResults {
  private readonly results = new Map<
    DiscoveryResultId,
    DiscoveryResult
  >();
  private nextResultId = 1;

  public getNextResultId(): DiscoveryResultId {
    return this.nextResultId++ as DiscoveryResultId;
  }

  // public register(result: DiscoveryResult, parentId: DiscoveryResultId): void {
  //   const nextResultId = this.getNextResultId();
  //   const resultWithIds =
  //     result
  //       .withId(nextResultId)
  //       .withParentId(parentId);
  //   this.results.set(nextResultId, resultWithIds);
  // }
}