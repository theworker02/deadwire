# Evidence redaction

Never emit authorization headers, credentials, full payment identifiers, unredacted PII, or raw large bodies. Prefer stable hashes and structural fingerprints. If replay fixtures are retained, encrypt them separately and apply shorter retention than audit records.
