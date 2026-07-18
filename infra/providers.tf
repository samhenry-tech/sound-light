# Provider configuration and Terraform backend.
#
# State uses the same shared bucket already configured in the GitHub Actions
# deploy workflow (`S3_BUCKET: projects.samhenry.tech`). Key is outside the
# per-repo SPA prefix so `aws s3 sync dist/ … --delete` cannot wipe it.

terraform {
  backend "s3" {
    bucket       = "projects.samhenry.tech"
    key          = "_terraform/sound-light/terraform.tfstate"
    region       = "ap-southeast-2"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = local.region

  default_tags {
    tags = local.tags
  }
}
