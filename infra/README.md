# atmos — AWS infrastructure (Terraform)

Raw-AWS, free-tier-only infrastructure for the **atmos** TTRPG music companion.
No Amplify; everything is provisioned with the Terraform AWS provider v5.

## What this provisions

| Area      | Resources                                                                                |
| --------- | ---------------------------------------------------------------------------------------- |
| Auth      | Cognito user pool, Hosted-UI domain, Google IdP (optional), public SPA app client (PKCE) |
| Data      | Two on-demand DynamoDB tables: `*-mixes` and `*-user-prefs`                              |
| API       | One Node 20 Lambda + API Gateway HTTP API (JWT authorizer, CORS, 7 routes)               |
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
├── cognito.tf             # User pool, domain, Google IdP, SPA client
├── dynamodb.tf            # mixes + user_prefs tables
├── lambda.tf              # API Lambda, IAM role, log group
├── apigateway.tf          # HTTP API, JWT authorizer, routes, stage
├── hosting.tf             # S3 bucket + CloudFront + bucket policy
├── github_oidc.tf         # GitHub OIDC provider + frontend deploy role
├── outputs.tf             # Outputs consumed by the frontend + workflows
├── terraform.tfvars.example
└── lambda/api/            # The API Lambda (TypeScript, esbuild-bundled)
```

## Prerequisites

- Terraform >= 1.6, AWS credentials with permission to create the above.
- Node 20 (to build the Lambda bundle).
- A Cognito Hosted-UI **domain prefix** that is globally unique in the region
  (`cognito_domain_prefix`, default `atmos-auth`).
- (Optional but recommended) Google OAuth client id/secret for federation.

## Quick start (local)

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # edit values

# 1. Build the Lambda deployment bundle (required before plan/apply).
( cd lambda/api && npm ci && npm run build )

# 2. Initialise + apply.
terraform init
terraform apply
```

> `terraform validate` works **without** building the Lambda. `plan`/`apply`
> require `lambda/api/dist/index.js` to exist (step 1) so the deployment zip can
> be assembled.

## Feeding the outputs back to the frontend

After `terraform apply`, wire `terraform output` values into the SPA's env
(`.env.local` for dev, GitHub **Variables** for the deploy workflow):

| Terraform output           | Frontend env var         |
| -------------------------- | ------------------------ |
| `api_base_url`             | `VITE_API_BASE_URL`      |
| `cognito_authority`        | `VITE_COGNITO_AUTHORITY` |
| `cognito_client_id`        | `VITE_COGNITO_CLIENT_ID` |
| `cognito_hosted_ui_domain` | `VITE_COGNITO_HOSTED_UI` |

`VITE_COGNITO_REDIRECT_URI` / `VITE_COGNITO_LOGOUT_URI` must match one of the
app client's `callback_urls` / `logout_urls`.

See [`IMPLEMENTATION_NOTES.md`](./IMPLEMENTATION_NOTES.md) for the full operator
runbook: Google OAuth setup, the CI bootstrap role, and every GitHub
`vars`/`secrets` name the workflows reference.
