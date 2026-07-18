# sound-light — AWS infrastructure (Terraform)

Raw-AWS, free-tier-only infrastructure for the **sound-light** TTRPG music companion.
No Amplify; everything is provisioned with the Terraform AWS provider v5.

## Architecture

There is **no API layer**. The SPA signs users in with Google (official
Sign in with Google button), exchanges the Google ID token for temporary AWS
credentials via a **Cognito Identity Pool**, and talks to **DynamoDB directly**
from the browser. Row-level isolation is enforced by IAM: the authenticated
role's DynamoDB policy uses a `dynamodb:LeadingKeys` condition so each user can
only read/write items whose partition key (`owner`) equals their own Cognito
identity id.

## What this provisions

| Area | Resources                                                                                   |
| ---- | ------------------------------------------------------------------------------------------- |
| Auth | Cognito Identity Pool (Google login provider), authenticated IAM role + row-level policy    |
| Data | Two provisioned DynamoDB tables (12 RCU / 12 WCU each): `*-playlists` and `*-user-settings` |

All resources are tagged with `Project=sound-light`, `ManagedBy=Terraform`, and named
`sound-light-dev-*` by default (`${project}-${environment}` from `config/shared.json`).

> **Hosting is not managed here.** The SPA is published to the shared
> `projects.samhenry.tech` S3 bucket + CloudFront distribution by
> `.github/workflows/deploy-frontend.yml` (per-repo subfolder, shared
> `deploy-role` assumed via GitHub OIDC). This stack owns only Cognito + DynamoDB.

## Layout

```
infra/
├── versions.tf            # Terraform / provider version pins (aws + local)
├── providers.tf           # AWS provider + S3 backend (projects.samhenry.tech)
├── backend.tf.example     # Notes about the shared-bucket state key
├── variables.tf           # Reserved (inputs come from config/shared.json)
├── locals.tf              # Reads ../config/shared.json + name_prefix/tags
├── cognito.tf             # Identity pool, authenticated role, DynamoDB row policy
├── dynamodb.tf            # playlists + user_settings tables (provisioned 12/12)
├── frontend_config.tf     # Writes ../src/config.generated.json from outputs
├── outputs.tf             # Outputs also mirrored into the generated JSON
├── scripts/               # Import existing resources; clean orphan Cognito pools
└── terraform.tfvars.example
```

## Prerequisites

- Terraform >= 1.10 (S3 `use_lockfile`), AWS credentials with permission to
  manage the Cognito/DynamoDB/IAM resources and read/write the state object in
  `projects.samhenry.tech`.
- Public inputs in [`config/shared.json`](../config/shared.json) (Google OAuth
  Web client id, region, project/environment naming). No client secret is
  needed. Register your app origins (`http://localhost:3000` and the
  production URL) as **authorised JavaScript origins** on that Google client.

## Quick start (local)

```bash
# Edit shared inputs if needed
$EDITOR config/shared.json

cd infra
terraform init
# First time only, if AWS resources already exist but state is empty:
../infra/scripts/import_existing.sh
terraform apply   # also refreshes ../src/config.generated.json
```

Remote state is stored in the **same bucket the deploy Action uses**:

`s3://projects.samhenry.tech/_terraform/sound-light/terraform.tfstate`

(outside the `sound-light/` SPA prefix so deploy `--delete` syncs leave it alone).

## Shared config ↔ frontend

| Source                      | Read by                        | Purpose                                 |
| --------------------------- | ------------------------------ | --------------------------------------- |
| `config/shared.json`        | Terraform (`locals.tf`) + Vite | Hand-edited public inputs               |
| `src/config.generated.json` | Vite (`src/config.ts`)         | Written by Terraform apply from outputs |

| Terraform output           | Field in `src/config.generated.json` |
| -------------------------- | ------------------------------------ |
| `cognito_identity_pool_id` | `cognitoIdentityPoolId`              |
| `playlists_table_name`     | `playlistsTable`                     |
| `user_settings_table_name` | `settingsTable`                      |
| `aws_region`               | `awsRegion`                          |

See [`IMPLEMENTATION_NOTES.md`](./IMPLEMENTATION_NOTES.md) for the full operator
runbook: Google OAuth setup and every GitHub `secrets` name the workflows
reference.
