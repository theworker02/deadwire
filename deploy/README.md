# Deployment reference

Deadwire production deployment has three trust zones: public evidence ingress, authenticated API/console, and a private recovery worker. The worker alone receives the QStash recovery token and verifier credentials.

The local implementation intentionally does not start hosted services. Use these artifacts as an infrastructure baseline after selecting an approved cloud/runtime provider.
