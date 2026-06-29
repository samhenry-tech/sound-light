# Terraform + provider version constraints.
#
# Pinned per the project's hard constraints:
#   - Terraform CLI >= 1.6
#   - AWS provider v5.x
#   - archive provider for building the Lambda deployment zip
terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}
