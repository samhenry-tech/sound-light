# Terraform + provider version constraints.
#
# Pinned per the project's hard constraints:
#   - Terraform CLI >= 1.6
#   - AWS provider v5.x
terraform {
  required_version = ">= 1.6"

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
