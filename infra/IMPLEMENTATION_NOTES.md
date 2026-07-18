# sound-light infrastructure — implementation notes & operator runbook

This document covers everything an operator must do **by hand** to stand up the
sound-light backend, plus a reference for every GitHub `vars`/`secrets` name the CI/CD
workflows depend on.

---

## 1. Architecture overview

There is **no API Gateway, no Lambda, and no Cognito User Pool**. The stack is:

1. The SPA renders the official **Sign in with Google** button via Google
   Identity Services (GIS) + FedCM, which returns a Google **ID token** directly
   in the browser — no authorization-code exchange and no `client_secret` (a
   static SPA cannot hold one). Sessions slide: the ID token is silently
   re-minted via FedCM (`navigator.credentials.get`, `mediation: 'silent'`)
   before it expires, as long as the user's Google session is alive.
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

| File                       | Purpose                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| `versions.tf`              | `required_version >= 1.6`; pins AWS `~> 5.0` + local `~> 2.5`.                                |
| `providers.tf`             | AWS provider + S3 backend on `projects.samhenry.tech` (`_terraform/sound-light/…`).           |
| `scripts/*.sh`             | Import existing AWS resources into empty state; delete orphan Cognito pools.                  |
| `backend.tf.example`       | Notes for the shared-bucket state key (backend is already enabled in `providers.tf`).         |
| `variables.tf`             | Reserved — public inputs come from `config/shared.json`.                                      |
| `locals.tf`                | `jsondecode(file("../config/shared.json"))` + `name_prefix` / tags.                           |
| `cognito.tf`               | Identity pool (Google provider), authenticated role, `LeadingKeys` DynamoDB policy.           |
| `dynamodb.tf`              | `*-playlists` (owner+id) and `*-user-settings` (owner) — both PROVISIONED at 12 RCU / 12 WCU. |
| `frontend_config.tf`       | `local_file` writing `src/config.generated.json` from Terraform outputs.                      |
| `outputs.tf`               | Cognito / table / region outputs (mirrored into the generated JSON).                          |
| `terraform.tfvars.example` | Notes that tfvars are unused; edit `config/shared.json` instead.                              |

### GitHub Actions (`.github/workflows/`)

- `ci.yml` — PRs + non-main pushes. Jobs: **frontend** (format/lint/typecheck/
  test/build) and **terraform-validate** (`fmt -check -recursive`, `init
-backend=false`, `validate`).
- `deploy-frontend.yml` — push to `main` (app paths) + manual. Builds the SPA
  (public config from `config/shared.json` + `src/config.generated.json`), then
  `aws s3 sync dist --delete` + a CloudFront invalidation.
- `terraform.yml` — PR (plan, posts a comment) + push to `main` (apply) +
  manual. Triggers on `infra/**` and `config/**`. State is stored in the shared
  `projects.samhenry.tech` bucket. Empty state is filled via
  `import_existing.sh` once; orphan Cognito pools are cleaned each run. After
  apply on `main`, commits any refresh of `src/config.generated.json`.

---

## 2. Data model (DynamoDB, accessed from the browser)

`Playlist` / `UserSettings` shapes are defined once as Zod schemas in
`src/shared/contract.ts`; the DynamoDB adapter (`src/api/adapters/
dynamoAdapter.ts`) validates everything it reads and writes against them.

| Table             | Keys                         | Contents                                            |
| ----------------- | ---------------------------- | --------------------------------------------------- |
| `*-playlists`     | `owner` (HASH), `id` (RANGE) | One item per playlist; listed via Query on `owner`. |
| `*-user-settings` | `owner` (HASH)               | One item per user (accent, columns, …).             |

---

## 3. Manual operator steps

### 3.1 Google OAuth client

1. Google Cloud Console → **APIs & Services → Credentials → Create credentials →
   OAuth client ID → Web application**.
2. **Authorised JavaScript origins:** every app origin, e.g.
   `http://localhost:3000` and `https://<dist>.cloudfront.net`. (Required for
   the GIS button / FedCM.)
3. **Authorised redirect URIs:** none needed — GIS/FedCM returns the ID token to
   the JavaScript origin, so there is no server-side redirect callback.
4. No client secret is used anywhere — only the **client ID**, stored once in
   `config/shared.json` (`googleClientId`) for both Terraform and the SPA.

### 3.2 First-time apply ordering

1. Put the Google client id (and region / naming) in `config/shared.json`.
2. `cd infra && terraform init && terraform apply` — this also writes
   `src/config.generated.json`.
3. Once the CloudFront domain is known, add it to the Google client's
   authorised origins + redirect URIs (§3.1).

---

## 4. GitHub configuration reference

Set these under **Settings → Secrets and variables → Actions**. Sensitive values
go in **Secrets**; everything else in **Variables**.

### 4.1 Repository **Variables** (`vars.*`)

None required. Public inputs live in `config/shared.json`; Terraform outputs
for the SPA are written to `src/config.generated.json`. Spotify mock mode is
off automatically for production builds (`import.meta.env.PROD`).

### 4.2 Repository **Secrets** (`secrets.*`)

| Secret                                     | Used by         | Value / source                                             |
| ------------------------------------------ | --------------- | ---------------------------------------------------------- |
| `AWS_ACCESS_KEY_ID`                        | terraform       | Org-provided AWS credentials (samhenry-tech public repos). |
| `AWS_SECRET_ACCESS_KEY`                    | terraform       | Org-provided AWS credentials (samhenry-tech public repos). |
| `SAMHENRY_TECH_CLOUDFRONT_DISTRIBUTION_ID` | deploy-frontend | Shared CloudFront distribution id for cache invalidation.  |

> `deploy-frontend.yml` publishes to the shared `projects.samhenry.tech` bucket
> and assumes `arn:aws:iam::904581404707:role/deploy-role` via GitHub OIDC
> (`id-token: write`), so it needs no static AWS keys. The Google client id is
> no longer a `TF_VAR_*` secret — it is read from `config/shared.json`.

---

## 5. Terraform outputs (consumed by frontend)

Written to `src/config.generated.json` by `local_file.frontend_config` on apply
(and committed by the terraform workflow on `main`).

| Output                     | Example                         | Field in `src/config.generated.json` |
| -------------------------- | ------------------------------- | ------------------------------------ |
| `cognito_identity_pool_id` | `ap-southeast-2:1a2b...`        | `cognitoIdentityPoolId`              |
| `playlists_table_name`     | `sound-light-dev-playlists`     | `playlistsTable`                     |
| `user_settings_table_name` | `sound-light-dev-user-settings` | `settingsTable`                      |
| `aws_region`               | `ap-southeast-2`                | `awsRegion`                          |

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
