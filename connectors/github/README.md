# GitHub connector

The GitHub connector uses a fine-grained, read-only token to compare candidate and prior deployment SHAs. Its output is a `DeploymentSignal` containing changed files and package/lockfile changes. It never writes commits, issues, or deployments.
