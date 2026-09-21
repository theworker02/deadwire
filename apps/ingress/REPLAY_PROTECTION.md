# Replay protection

Store a nonce or body-hash plus timestamp per tenant for the permitted webhook window. Reject duplicates without reprocessing, tolerate safe response retries through an idempotency key, and record both accepted and rejected webhook attempts in audit history without persisting raw secret-bearing bodies.
