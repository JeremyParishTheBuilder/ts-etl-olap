High priority
Simplify the capture model.
Remove captureName/captureResolver pairing.
Allow multiple captures per scope.
Make captures feel like declarations rather than special cases.

Medium priority
Clean up DiscoveryResult.
Continue separating discovery concerns from import concerns.
Consider whether objects eventually becomes a typed lookup rather than Map<string, FsObject>.

Medium priority
Reduce explicit mappings further.
See how much of the Cosmos registry can be imported with almost no manual configuration.

Lower priority
Constraint / validation layer.
Foreign keys.
Check constraints.
Business rules.
Cross-file validation.

Current priority: simplify capture specification. The current captureName + captureResolver API works, but feels more verbose than the rest of the mapping layer after recent simplifications. The next design session should focus on making capture declaration more declarative while preserving flexibility.