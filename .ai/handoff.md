Next session

The next session should focus on removing the remaining filesystem-specific assumptions from discovery initialization.

Currently, ImportPipeline is given the root Directory, while the discovery graph itself has no notion of its own root. This makes discovery dependent on an external caller rather than being a complete description of how to discover a dataset.

The goal is to introduce a DiscoveryRoot (mirroring ImportRoot) that owns both the root data source (such as a Directory or other external source) and the root DiscoveryNode. DiscoveryPipeline would then execute one or more DiscoveryRoots directly, producing DiscoveryResults that are already associated with their originating discovery graph. This would complete the architectural symmetry between discovery and import, eliminate the remaining special handling in ImportPipeline, and prepare the framework to support non-filesystem data sources (HTTP APIs, archives, databases, etc.) without changing discovery logic.