# Provider configuration and Terraform backend.
#
# Backend: a LOCAL backend is used by default so the project works out of the
# box with no pre-existing remote state. To use a shared remote state (strongly
# recommended once more than one operator/CI runs `apply`), uncomment the
# `backend "s3"` block below (and see backend.tf.example) and re-run
# `terraform init -migrate-state`.
terraform {
  # ---------------------------------------------------------------------------
  # Remote state example (commented out — local backend is the default).
  #
  # Create the bucket + lock table OUT OF BAND first (they cannot be managed by
  # the same state they store). A DynamoDB lock table is optional with newer
  # Terraform S3 backends (use_lockfile), but shown here for broad compatibility.
  # ---------------------------------------------------------------------------
  # backend "s3" {
  #   bucket         = "sound-light-tfstate-<your-account-id>"
  #   key            = "sound-light/dev/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "sound-light-tf-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = local.region

  default_tags {
    tags = local.tags
  }
}
