# Cloudflare deployment

The production Worker is `bead-atelier`. GitHub Actions builds and tests every
push to `main`, then deploys only when both checks succeed. Pull requests run
the same checks without deploying. Local commits take effect after `git push`.

## One-time account connection

In the GitHub repository's **Settings → Secrets and variables → Actions**:

- Add a repository **secret** named `CLOUDFLARE_API_TOKEN`. Create a Cloudflare
  API token with **Account → Workers Scripts → Edit**, restricted to the account
  hosting this Worker. Do not put the token in source control or a plain variable.
- Add a repository **variable** named `CLOUDFLARE_ACCOUNT_ID` containing that
  Cloudflare account's ID.

The token must remain valid for future deployments. After configuring the
connection, use **Actions → Deploy to Cloudflare → Run workflow** on `main`,
or push a commit. The successful deployment log contains the `workers.dev` URL.

## Runtime settings

In **Cloudflare → Workers & Pages → bead-atelier → Settings → Variables and
Secrets**, set `APP_ORIGIN` to the full HTTPS origin shown after the first
deployment (without a trailing slash). This enables canonical URLs, social
links and search indexing. `keep_vars` preserves dashboard variables across
future automatic deployments.

Guest mode is the default. It does not require Supabase or email credentials;
designs are stored in the visitor's browser. The workflow builds the guest-only
interface. Launching accounts later requires changing that build flag and
configuring the server-side account settings together.

## Connect your domain later

Add the domain under **Settings → Domains & Routes → Add → Custom domain**.
Complete the DNS setup Cloudflare requests, then update `APP_ORIGIN` to that
HTTPS domain. Domain registration can remain at GoDaddy. The deployment
workflow continues to work without any changes to the domain's DNS records.

## Local checks and manual deployment

Use Node.js from `.nvmrc` (for example, `nvm use`), then:

```sh
npm ci
npm run build:cloudflare
npm run test:ci
npx wrangler deploy --dry-run
npm run deploy:cloudflare
```

The Vite plugin produces `dist/server/wrangler.json` and a Wrangler deployment
pointer. Build before deploying so Wrangler uploads the compiled application
and static assets, rather than the TypeScript source entry point.

Workers Free limits apply. Do not enable paid services or upgrade the account
as part of this setup; review actual production resource usage before changing
the plan. A failed build or test does not replace the previously deployed site.
