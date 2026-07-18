# sound-light infrastructure — implementation notes & operator runbook

This document covers everything an operator must do **by hand** to stand up the
sound-light backend, plus a reference for every GitHub `vars`/`secrets` name the CI/CD
workflows depend on.

---

## 1. Architecture overview

There is **no API Gateway, no Lambda, and no Cognito User Pool**. The stack is:

1. The SPA renders the official **Sign in with Google** button
   (Google Identity Services). Popup mode is the primary UX; a redirect flow to
   `/auth/google/callback` is offered as a fallback for popup-blocking browsers.
2. The resulting **Google ID token** is sent to a **Cognito Identity Pool**
   (`accounts.google.com` login provider), which vends temporary AWS
   credentials for the authenticated IAM role.
3. The browser uses those credentials to call **DynamoDB directly** with the
   AWS SDK v3 (`@aws-sdk/lib-dynamodb`).
4. Row-level security is IAM-enforced: the role's DynamoDB policy carries a
   `ForAllValues:StringEquals` condition on `dynamodb:LeadingKeys` =
   `${cognito-identity.amazonaws.com:sub}`, so every Query/Get/Put/Delete is
   only allowed when the item's partition key (`owner`) is the caller's own
   **Cognito identity id** (`<region>:<uuid>`).

> The `owner` attribute stored in DynamoDB is therefore the Cognito **identity
> id**, not the Google `sub`. The frontend gets it from
> `cognito-identity:GetId` after Google sign-in.

### Terraform (`infra/`)

| File                       | Purpose                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| `versions.tf`              | `required_version >= 1.6`; pins AWS `~> 5.0`.                                             |
| `providers.tf`             | AWS provider (region var, `default_tags`); commented `backend "s3"` (local by default).   |
| `backend.tf.example`       | Drop-in remote-state config + out-of-band bucket/lock-table creation commands.            |
| `variables.tf`             | Inputs: project/env/region, `google_client_id` (required), GitHub OIDC settings.          |
| `locals.tf`                | `name_prefix = "${project}-${environment}"` + common `tags`.                              |
| `cognito.tf`               | Identity pool (Google provider), authenticated role, `LeadingKeys` DynamoDB policy.       |
| `dynamodb.tf`              | `*-mixes` (owner+id) and `*-user-settings` (owner) — both PROVISIONED at 12 RCU / 12 WCU. |
| `hosting.tf`               | Private S3 bucket, CloudFront + OAC, SPA 403/404→index.html, restrictive bucket policy.   |
| `github_oidc.tf`           | GitHub OIDC provider (create-or-lookup) + frontend-scoped deploy role.                    |
| `outputs.tf`               | The 8 outputs (see §5).                                                                   |
| `terraform.tfvars.example` | Copy to `terraform.tfvars` and fill in.                                                   |

### GitHub Actions (`.github/workflows/`)

- `ci.yml` — PRs + non-main pushes. Jobs: **frontend** (format/lint/typecheck/
  test/build) and **terraform-validate** (`fmt -check -recursive`, `init
-backend=false`, `validate`).
- `deploy-frontend.yml` — push to `main` (app paths) + manual. Builds the SPA
  (public config from `src/config.ts`), then `aws s3 sync dist --delete` + a
  CloudFront invalidation.
- `terraform.yml` — PR (plan, posts a comment) + push to `main` (apply) +
  manual. `init/fmt/validate/plan`, then `apply -auto-approve` of the saved
  plan only on push to main. No build step — there is no Lambda.

---

## 2. Data model (DynamoDB, accessed from the browser)

`Mix` / `UserSettings` shapes are defined once as Zod schemas in
`src/shared/contract.ts`; the DynamoDB adapter (`src/api/adapters/
dynamoAdapter.ts`) validates everything it reads and writes against them.

| Table             | Keys                         | Contents                                       |
| ----------------- | ---------------------------- | ---------------------------------------------- |
| `*-mixes`         | `owner` (HASH), `id` (RANGE) | One item per mix; listed via Query on `owner`. |
| `*-user-settings` | `owner` (HASH)               | One item per user (accent, columns, …).        |

---

## 3. Manual operator steps

### 3.1 Google OAuth client

1. Google Cloud Console → **APIs & Services → Credentials → Create credentials →
   OAuth client ID → Web application**.
2. **Authorised JavaScript origins:** every app origin, e.g.
   `http://localhost:3000` and `https://<dist>.cloudfront.net`. (Required for
   the GIS popup button.)
3. **Authorised redirect URIs:** the redirect-fallback callback on every
   origin, e.g. `http://localhost:3000/auth/google/callback` and
   `https://<dist>.cloudfront.net/auth/google/callback`.
4. No client secret is used anywhere — only the **client ID**:
   - Terraform: `google_client_id` in `terraform.tfvars`
     (CI: secret `TF_VAR_google_client_id`);
   - Frontend: `googleClientId` in `src/config.ts`.

### 3.2 First-time apply ordering

1. `cd infra && terraform init && terraform apply`.
2. Read outputs (§5) and update `src/config.ts`.
3. Once the CloudFront domain is known, add it to the Google client's
   authorised origins + redirect URIs (§3.1).

---

## 4. GitHub configuration reference

Set these under **Settings → Secrets and variables → Actions**. Sensitive values
go in **Secrets**; everything else in **Variables**.

### 4.1 Repository **Variables** (`vars.*`)

None required. Public SPA config (Google client id, Cognito pool id, Spotify
client id, region, table names) lives in `src/config.ts`. Spotify mock mode is
off automatically for production builds (`import.meta.env.PROD`).

### 4.2 Repository **Secrets** (`secrets.*`)

| Secret                                     | Used by         | Value / source                                             |
| ------------------------------------------ | --------------- | ---------------------------------------------------------- |
| `AWS_ACCESS_KEY_ID`                        | terraform       | Org-provided AWS credentials (samhenry-tech public repos). |
| `AWS_SECRET_ACCESS_KEY`                    | terraform       | Org-provided AWS credentials (samhenry-tech public repos). |
| `TF_VAR_google_client_id`                  | terraform       | Google OAuth client id (→ `var.google_client_id`).         |
| `SAMHENRY_TECH_CLOUDFRONT_DISTRIBUTION_ID` | deploy-frontend | Shared CloudFront distribution id for cache invalidation.  |

> `deploy-frontend.yml` publishes to the shared `projects.samhenry.tech` bucket
> and assumes `arn:aws:iam::904581404707:role/deploy-role` via GitHub OIDC
> (`id-token: write`), so it needs no static AWS keys.

`TF_VAR_*` env vars are Terraform's native way to set the matching variables,
so the workflow just exports them; no `-var` flags needed. The Google client ID
is not truly secret (it also lives in `src/config.ts` for the SPA) — the
`TF_VAR_*` secret is only how CI supplies it to Terraform.

---

## 5. Terraform outputs (consumed by frontend)

| Output                     | Example                         | Maps to in `src/config.ts` |
| -------------------------- | ------------------------------- | -------------------------- |
| `cognito_identity_pool_id` | `ap-southeast-2:1a2b...`        | `cognitoIdentityPoolId`    |
| `mixes_table_name`         | `sound-light-dev-mixes`         | `mixesTable`               |
| `user_settings_table_name` | `sound-light-dev-user-settings` | `settingsTable`            |
| `aws_region`               | `ap-southeast-2`                | `awsRegion`                |

---

## 6. Free-tier / cost notes

- DynamoDB: PROVISIONED at 12 RCU / 12 WCU per table (24 total per dimension),
  which fits inside the always-free allowance of 25 RCU + 25 WCU per account
  (summed across tables).
- Cognito Identity Pools: free (no MAU charges, unlike user pools with
  advanced security).
- S3 + CloudFront: free-tier eligible; `PriceClass_100`, default CloudFront
  certificate (no ACM).
- **No** Lambda, **no** API Gateway, **no** NAT gateways, **no** WAF, **no**
  CloudWatch log groups.
- The optional remote backend (S3 state bucket + on-demand lock table) is also
  free-tier friendly.
