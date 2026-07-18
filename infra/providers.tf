# Provider configuration and Terraform backend.
#
# A LOCAL backend is used on purpose: the shared GitHub OIDC deploy-role cannot
# create an S3 state bucket. CI therefore starts each job with empty state and
# re-imports existing AWS resources via infra/scripts/import_existing.sh before
# plan/apply (see .github/workflows/terraform.yml). Do not switch to a remote
# backend unless that role (or a dedicated terraform role) can own the bucket.

provider "aws" {
  region = local.region

  default_tags {
    tags = local.tags
  }
}
