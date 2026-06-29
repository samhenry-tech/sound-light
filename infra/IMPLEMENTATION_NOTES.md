# atmos infrastructure — implementation notes & operator runbook

This document covers everything an operator must do **by hand** to stand up the
atmos backend, plus a reference for every GitHub `vars`/`secrets` name the CI/CD
workflows depend on.

It is written for review (the infrastructure is **not** applied in this
environment).

---

## 1. What was created

### Terraform (`infra/`)

| File                       | Purpose                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------- |
| `versions.tf`              | `required_version >= 1.6`; pins AWS `~> 5.0` and `archive ~> 2.4`.                      |
| `providers.tf`             | AWS provider (region var, `default_tags`); commented `backend "s3"` (local by default). |
| `backend.tf.example`       | Drop-in remote-state config + out-of-band bucket/lock-table creation commands.          |
| `variables.tf`             | All inputs (project/env/region, Cognito, Google creds, URLs, CORS, GitHub OIDC).        |
| `locals.tf`                | `name_prefix = "${project}-${environment}"`, common `tags`, Google-enabled flag.        |
| `cognito.tf`               | User pool, Hosted-UI domain, Google IdP (conditional), public SPA app client (PKCE).    |
| `dynamodb.tf`              | `*-mixes` (owner+id) and `*-user-prefs` (owner) — both `PAY_PER_REQUEST`.               |
| `lambda.tf`                | API Lambda (`nodejs20.x`), least-priv IAM role, `archive_file` zip, log group (14-day). |
| `apigateway.tf`            | HTTP API, CORS, Cognito JWT authorizer, the 7 routes, `$default` stage, invoke perm.    |
| `hosting.tf`               | Private S3 bucket, CloudFront + OAC, SPA 403/404→index.html, restrictive bucket policy. |
| `github_oidc.tf`           | GitHub OIDC provider (create-or-lookup) + frontend-scoped deploy role.                  |
| `outputs.tf`               | The 9 required outputs (see §6).                                                        |
| `terraform.tfvars.example` | Copy to `terraform.tfvars` and fill in.                                                 |

### Lambda (`infra/lambda/api/`)

- `src/index.ts` — one TypeScript handler (`index.handler`) with an internal
  router keyed on `event.requestContext.routeKey`. Uses
  `@aws-sdk/lib-dynamodb` (DocumentClient). `owner` is **always** read from the
  verified JWT `sub` claim (`event.requestContext.authorizer.jwt.claims.sub`),
  never from the request body or path. CORS is left to API Gateway.
- `package.json` — runtime deps `@aws-sdk/client-dynamodb` + `@aws-sdk/lib-dynamodb`;
  dev deps `esbuild`, `@types/aws-lambda`, `@types/node`, `typescript`.
  `build` = `esbuild ... --external:@aws-sdk/*` (SDK v3 is in the Node 20 runtime).
- `tsconfig.json` — strict; `tsc --noEmit` typecheck (esbuild does the bundling).
- `dist/.gitkeep` — keeps `dist/` tracked; the real `dist/index.js` / `api.zip`
  are build artifacts and are **git-ignored** (see root `.gitignore`).

### GitHub Actions (`.github/workflows/`)

- `ci.yml` — PRs + non-main pushes. Jobs: **frontend** (format/lint/typecheck/
  test/build) and **terraform-validate** (`fmt -check -recursive`, `init
-backend=false`, `validate`). Concurrency cancels superseded runs.
- `deploy-frontend.yml` — push to `main` (app paths) + manual. Builds the SPA
  with `VITE_*` from repo Variables, authenticates with the org AWS credentials,
  `aws s3 sync dist --delete`, then a CloudFront invalidation.
- `terraform.yml` — PR (plan, posts a comment) + push to `main` (apply) +
  manual. Builds the Lambda bundle first, then `init/fmt/validate/plan`, and
  `apply -auto-approve` of the saved plan only on push to main.

> **Note on workflow provenance:** the task suggested copying workflows from
> other `samhenry-tech` repos, but repo access in this environment is scoped to
> `samhenry-tech/sound-light` only — other repos could not be read. These
> workflows were therefore written from scratch following current GitHub Actions
> best practices (pinned major action versions, least-priv `permissions`,
> concurrency groups). They authenticate to AWS with the org-provided
> credentials (§4).

---

## 2. The data contract (Lambda routes)

All routes sit behind the Cognito JWT authorizer. `Mix` / `UserPrefs` mirror the
frontend Zod schemas in `src/shared/contract.ts`.

| Method + route       | Behaviour                                                                                                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /mixes`         | `200 Mix[]` — Query by `owner`, sorted by `sortIndex` then `createdAt`.                                                                                                             |
| `POST /mixes`        | `201 Mix` — server fills `id` (`mix-<uuid>`), `owner`, `createdAt`, `updatedAt`; defaults `location:"General"`, `atmosphere:"ambient"`, `pinned:false`, arrays `[]`, `sortIndex:0`. |
| `GET /mixes/{id}`    | `200 Mix` or `404`.                                                                                                                                                                 |
| `PUT /mixes/{id}`    | `200 Mix` — partial update of mutable fields, refreshes `updatedAt`; `404` if missing.                                                                                              |
| `DELETE /mixes/{id}` | `204` (idempotent).                                                                                                                                                                 |
| `GET /prefs`         | `200 UserPrefs` — returns defaults `{accent:"#3ecf8e",columns:5,cardLabel:"split",spotifyLinked:false}` when none stored (not persisted).                                           |
| `PUT /prefs`         | `200 UserPrefs` — upsert (merges over existing/defaults).                                                                                                                           |

Invalid input → `400` (e.g. unknown `atmosphere`, non-hex `accent`, `columns`
outside 4–6, wrong types). Missing/blank `sub` → `401`. Unknown route → `404`.

---

## 3. Manual operator steps

### 3.1 Google OAuth (for Cognito Google federation)

1. Google Cloud Console → **APIs & Services → Credentials → Create credentials →
   OAuth client ID → Web application**.
2. **Authorised JavaScript origins:** your app origins (e.g.
   `http://localhost:3000` and the CloudFront URL).
3. **Authorised redirect URIs:** the Cognito Hosted-UI IdP-response endpoint:
   ```
   https://<cognito_domain_prefix>.auth.<region>.amazoncognito.com/oauth2/idpresponse
   ```
   (e.g. `https://atmos-auth.auth.us-east-1.amazoncognito.com/oauth2/idpresponse`).
4. On the OAuth consent screen, ensure the **email** and **profile** scopes are
   present (they back the `openid email profile` request).
5. Copy the **client ID** and **client secret** into Terraform:
   - locally: `google_client_id` / `google_client_secret` in `terraform.tfvars`;
   - in CI: GitHub **secrets** `TF_VAR_google_client_id` /
     `TF_VAR_google_client_secret` (see §5).

> If Google credentials are left blank, Terraform skips the Google IdP and the
> SPA client supports only `COGNITO` (email/password). This keeps `apply`
> working before Google is configured.

### 3.2 Cognito Hosted-UI domain prerequisite

- `cognito_domain_prefix` (default `atmos-auth`) must be **globally unique
  within the region** across all AWS accounts. If `apply` fails because the
  prefix is taken, choose another (e.g. `atmos-auth-<something>`) and update both
  the variable and any Google redirect URI that embeds it.
- The resulting Hosted-UI base URL is
  `https://<prefix>.auth.<region>.amazoncognito.com` (exported as
  `cognito_hosted_ui_domain`).

### 3.3 Redirect / CORS allow-lists

After you know the CloudFront domain (`terraform output cloudfront_domain`), add
it to:

- `callback_urls` → `https://<dist>.cloudfront.net/auth/callback`
- `logout_urls` → `https://<dist>.cloudfront.net`
- `allowed_origins` → `https://<dist>.cloudfront.net`

then re-`apply`. (`http://localhost:3000` entries are kept for local dev.)

### 3.4 First-time apply ordering

1. Build the Lambda bundle: `cd infra/lambda/api && npm ci && npm run build`.
2. `terraform init && terraform apply`.
3. Read outputs (§6) and populate the SPA env / GitHub Variables.

---

## 4. AWS credentials in CI

The `deploy-frontend` and `terraform` workflows authenticate to AWS with the
**org-provided AWS credentials** (`samhenry-tech` exposes these to its public
repos as organization secrets):

| Secret                  | Used by                    |
| ----------------------- | -------------------------- |
| `AWS_ACCESS_KEY_ID`     | deploy-frontend, terraform |
| `AWS_SECRET_ACCESS_KEY` | deploy-frontend, terraform |

The credentials must allow: S3 sync of the SPA bucket + CloudFront invalidation
(deploy), and management of Cognito / DynamoDB / Lambda / IAM / API Gateway v2 /
S3 / CloudFront / CloudWatch Logs plus the Terraform state backend (terraform).

> `github_oidc.tf` still provisions a GitHub-OIDC deploy role as an **optional**
> hardening path; it is unused by the current workflows (which use the org keys
> above). Delete it, or switch the workflows back to `role-to-assume`, if you
> prefer OIDC over static keys.

---

## 5. GitHub configuration reference

Set these under **Settings → Secrets and variables → Actions**. Sensitive values
go in **Secrets**; everything else in **Variables**.

### 5.1 Repository **Variables** (`vars.*`)

| Variable                     | Used by               | Value / source                                                                                                                     |
| ---------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `AWS_REGION`                 | deploy, terraform     | e.g. `us-east-1` (match `var.region`). Optional — defaults to `us-east-1`.                                                         |
| `FRONTEND_BUCKET`            | deploy-frontend       | `terraform output frontend_bucket`.                                                                                                |
| `CLOUDFRONT_DISTRIBUTION_ID` | deploy-frontend       | `terraform output cloudfront_distribution_id`.                                                                                     |
| `VITE_API_BASE_URL`          | deploy-frontend build | `terraform output api_base_url`.                                                                                                   |
| `VITE_COGNITO_AUTHORITY`     | deploy-frontend build | `terraform output cognito_authority`.                                                                                              |
| `VITE_COGNITO_CLIENT_ID`     | deploy-frontend build | `terraform output cognito_client_id`.                                                                                              |
| `VITE_COGNITO_HOSTED_UI`     | deploy-frontend build | `terraform output cognito_hosted_ui_domain`.                                                                                       |
| `VITE_COGNITO_REDIRECT_URI`  | deploy-frontend build | e.g. `https://<dist>.cloudfront.net/auth/callback` (must be a registered callback URL).                                            |
| `VITE_COGNITO_LOGOUT_URI`    | deploy-frontend build | e.g. `https://<dist>.cloudfront.net` (must be a registered logout URL).                                                            |
| `VITE_SPOTIFY_CLIENT_ID`     | deploy-frontend build | Spotify app client id (the repo's `.env.example` ships one).                                                                       |
| `VITE_SPOTIFY_REDIRECT_URI`  | deploy-frontend build | Must EXACTLY match a Spotify-registered redirect URI (trailing slash matters), e.g. `https://<dist>.cloudfront.net/auth/spotify/`. |

> `VITE_SPOTIFY_MOCK=false` is hard-coded in `deploy-frontend.yml` (production
> uses the real Spotify API, not the bundled mock).

### 5.2 Repository **Secrets** (`secrets.*`)

| Secret                        | Used by                    | Value / source                                             |
| ----------------------------- | -------------------------- | ---------------------------------------------------------- |
| `AWS_ACCESS_KEY_ID`           | deploy-frontend, terraform | Org-provided AWS credentials (samhenry-tech public repos). |
| `AWS_SECRET_ACCESS_KEY`       | deploy-frontend, terraform | Org-provided AWS credentials (samhenry-tech public repos). |
| `TF_VAR_google_client_id`     | terraform                  | Google OAuth client id (→ `var.google_client_id`).         |
| `TF_VAR_google_client_secret` | terraform                  | Google OAuth client secret (→ `var.google_client_secret`). |

`TF_VAR_*` env vars are Terraform's native way to set the matching variables, so
the workflow just exports them; no `-var` flags needed.

---

## 6. Terraform outputs (consumed by frontend + workflows)

| Output                       | Example                                                      |
| ---------------------------- | ------------------------------------------------------------ |
| `api_base_url`               | `https://abc123.execute-api.us-east-1.amazonaws.com`         |
| `cognito_authority`          | `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXX` |
| `cognito_client_id`          | `1example23clientid`                                         |
| `cognito_hosted_ui_domain`   | `https://atmos-auth.auth.us-east-1.amazoncognito.com`        |
| `cognito_user_pool_id`       | `us-east-1_XXXXXXXXX`                                        |
| `frontend_bucket`            | `atmos-dev-frontend`                                         |
| `cloudfront_distribution_id` | `E1EXAMPLE234`                                               |
| `cloudfront_domain`          | `d111111abcdef8.cloudfront.net`                              |
| `github_deploy_role_arn`     | `arn:aws:iam::<acct>:role/atmos-dev-github-deploy`           |

---

## 7. Free-tier / cost notes

- DynamoDB: `PAY_PER_REQUEST` (on-demand); no provisioned capacity, **no PITR**.
- Lambda + API Gateway HTTP API + Cognito + S3: free-tier eligible.
- CloudFront: `PriceClass_100`, default CloudFront certificate (no ACM).
- **No** NAT gateways, **no** WAF, **no** standing-cost resources.
- CloudWatch Logs retention is bounded to 14 days to avoid unbounded storage.
- The optional remote backend (S3 state bucket + on-demand lock table) is also
  free-tier friendly.
