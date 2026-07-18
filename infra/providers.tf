# Provider configuration and Terraform backend.
#
# Remote S3 state is required so CI applies share one state (a local backend
# is discarded after each Actions job and causes recreate/import thrash).
# The bucket + lock table are created out of band by
# infra/scripts/ensure_remote_state.sh before `terraform init`.

terraform {
  backend "s3" {
    bucket         = "sound-light-tfstate-904581404707"
    key            = "sound-light/dev/terraform.tfstate"
    region         = "ap-southeast-2"
    dynamodb_table = "sound-light-tf-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = local.region

  default_tags {
    tags = local.tags
  }
}
