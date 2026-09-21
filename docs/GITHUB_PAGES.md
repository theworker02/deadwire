# GitHub Pages deployment

The static demonstration site is self-contained in `site/`; it has no build step and makes no API calls. The included workflow deploys it from `main` using GitHub Pages Actions.

## One-time repository setup

1. Push this project to a GitHub repository.
2. In **Settings → Pages**, select **GitHub Actions** as the source.
3. Ensure Actions has permission to deploy Pages.
4. Push to `main`, or run the workflow manually.

The resulting URL is normally `https://<owner>.github.io/<repository>/`. Configure a custom domain only after verifying ownership and HTTPS.

The Pages site is a public marketing/demo artifact. It must never contain Upstash tokens, customer evidence, raw error payloads, or unreleased recovery details.
