# atmos — AWS infrastructure (Terraform)

Raw-AWS, free-tier-only infrastructure for the **atmos** TTRPG music companion.
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

| Area      | Resources                                                                                |
| --------- | ---------------------------------------------------------------------------------------- |
| Auth      | Cognito Identity Pool (Google login provider), authenticated IAM role + row-level policy |
| Data      | Two provisioned DynamoDB tables (12 RCU / 12 WCU each): `*-mixes` and `*-user-settings`     |
| Hosting   | Private S3 bucket + CloudFront (OAC, SPA error-routing, PriceClass_100)                  |
| CI/CD IAM | GitHub OIDC provider + a frontend-deploy role                                            |

All resources are tagged with `Project=atmos`, `ManagedBy=Terraform`, and named
`atmos-dev-*` by default (`${var.project}-${var.environment}`).

## Layout

```
infra/
├── versions.tf            # Terraform / provider version pins
├── providers.tf           # AWS provider + (commented) S3 backend
├── backend.tf.example     # Remote-state setup, copy into providers.tf to enable
├── variables.tf           # All input variables
├── locals.tf              # name_prefix + common tags
├── cognito.tf             # Identity pool, authenticated role, DynamoDB row policy
├── dynamodb.tf            # mixes + user_settings tables (provisioned 12/12)
├── hosting.tf             # S3 bucket + CloudFront + bucket policy
├── github_oidc.tf         # GitHub OIDC provider + frontend deploy role
├── outputs.tf             # Outputs consumed by the frontend + workflows
└── terraform.tfvars.example
```

## Prerequisites

- Terraform >= 1.6, AWS credentials with permission to create the above.
- A Google OAuth 2.0 **Web application** client ID (`google_client_id`,
  required). No client secret is needed. Register your app origins
  (`http://localhost:3000` and the CloudFront URL) as **authorised JavaScript
  origins** on that client.

## Quick start (local)

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # edit values

terraform init
terraform apply
```

## Feeding the outputs back to the frontend

After `terraform apply`, wire `terraform output` values into the SPA's env
(`.env.local` for dev, GitHub **Variables** for the deploy workflow):

| Terraform output           | Frontend env var                |
| -------------------------- | ------------------------------- |
| `cognito_identity_pool_id` | `VITE_COGNITO_IDENTITY_POOL_ID` |
| `mixes_table_name`         | `VITE_MIXES_TABLE`              |
| `user_settings_table_name` | `VITE_SETTINGS_TABLE`           |
| `aws_region`               | `VITE_AWS_REGION`               |

`VITE_GOOGLE_CLIENT_ID` is the same Google client ID passed to Terraform as
`google_client_id`.

See [`IMPLEMENTATION_NOTES.md`](./IMPLEMENTATION_NOTES.md) for the full operator
runbook: Google OAuth setup and every GitHub `vars`/`secrets` name the
workflows reference.
