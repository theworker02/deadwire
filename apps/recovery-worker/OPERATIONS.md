# Recovery worker operations

Never retry a worker mutation blindly. Before a resume call, verify receipt status, tenant scope, approval count, plan hash, batch state, and flow-control values. After a provider response, persist the original DLQ ID and new workflow run ID atomically with an audit event.
