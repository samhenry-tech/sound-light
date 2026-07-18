# Terraform + provider version constraints.
#
# Pinned per the project's hard constraints:
#   - Terraform CLI >= 1.10 (S3 backend use_lockfile)
#   - AWS provider v5.x
terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }
}
