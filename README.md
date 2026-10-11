# Business Builder Cloudflare deployment preview

> **Development preview, not a finished product.** The 46 guide titles and navigation routes exist, but the canonical guide manuscript, working questionnaire, customer authentication, payment processing, secure licensing, and owner setup are not yet implemented in this repository. Do not accept payments or send customers here.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/alexisrbaker/callmeallie-business-builder-deploy)

Cloudflare's supported deployment flow clones this public repository into the deployer's GitHub account, builds on Cloudflare, and can automatically provision D1 and R2 from Wrangler bindings. It does not require installing Node or Wrangler on a customer's computer.

## Preview deployment

1. Select **Deploy to Cloudflare** above.
2. Sign into Cloudflare and GitHub if prompted.
3. Review the application name and proposed D1 database and R2 bucket.
4. Select **Deploy** and watch the Cloudflare build log.
5. Open the generated workers.dev URL and visit `/api/health`.

The Wrangler configuration intentionally contains placeholder D1 identifiers for Cloudflare's deploy flow to replace. The deployment does not attach to the owner's existing shared Call Me Allie identity database.

## Important limitations

- The quiz and 46 guide bodies are not functional yet.
- Account, checkout, reseller, and license routes are previews only.
- The license-status endpoint intentionally fails closed until authenticated license validation is implemented.
- The migrations include Allie-specific affiliate tables and are not yet the separated customer-edition schema.
- The self-service setup screen is a placeholder, not a setup wizard.
- Automatic provisioning has not yet been tested for this repository. Cloudflare may require adjustments in its setup screen.

## Developer notes

- Astro 6 + @astrojs/cloudflare adapter.
- Cloudflare Worker entrypoint: `@astrojs/cloudflare/entrypoints/server`.
- Build command: `npm run build`.
- Deploy command: `npm run deploy` (runs Wrangler deploy and remote D1 migrations).
- Bindings: `DB` (D1), `ASSETS` (R2), `STATIC_ASSETS` (static files).
- Do not commit Stripe credentials, Cloudflare API tokens, or production secrets.

This repository is a technical deployment experiment. The original v0.34 source ZIP has not been fully imported here; its missing code and canonical guide manuscript must be recovered from the original package rather than invented.
