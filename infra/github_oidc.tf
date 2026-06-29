# GitHub Actions OIDC provider + a frontend-deploy IAM role.
#
# The deploy workflow assumes this role via OIDC (no long-lived AWS keys). The
# role is intentionally narrow: it can sync the SPA bucket and invalidate the
# CloudFront distribution, and nothing else.
#
# NOTE: the role that runs `terraform apply` in CI (referenced as
# vars.AWS_TERRAFORM_ROLE_ARN in .github/workflows/terraform.yml) is a separate,
# broader role that must be bootstrapped out of band — Terraform cannot create
# the very role it assumes on the first apply. See infra/IMPLEMENTATION_NOTES.md.

# --------------------------------------------------------------------------- #
# OIDC provider (create or look up)                                           #
# --------------------------------------------------------------------------- #

# Create the provider in this account...
resource "aws_iam_openid_connect_provider" "github" {
  count = var.create_github_oidc_provider ? 1 : 0

  # Thumbprints are no longer validated for GitHub's IAM OIDC provider, but a
  # value is still required by the API; this is GitHub's well-known root CA
  # thumbprint.
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]

  tags = local.tags
}

# ...or reference the existing one when create_github_oidc_provider = false.
data "aws_iam_openid_connect_provider" "github" {
  count = var.create_github_oidc_provider ? 0 : 1
  url   = "https://token.actions.githubusercontent.com"
}

locals {
  github_oidc_provider_arn = var.create_github_oidc_provider ? aws_iam_openid_connect_provider.github[0].arn : data.aws_iam_openid_connect_provider.github[0].arn
}

# --------------------------------------------------------------------------- #
# Frontend deploy role                                                        #
# --------------------------------------------------------------------------- #

data "aws_iam_policy_document" "github_deploy_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [local.github_oidc_provider_arn]
    }

    # Only tokens minted for the AWS STS audience.
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # Only workflows running in this repository (any branch/tag/environment).
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repo}:*"]
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  name               = "${local.name_prefix}-github-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_deploy_assume_role.json
  tags               = local.tags
}

# Frontend-scoped permissions: S3 sync of the SPA bucket + CloudFront
# invalidation of this distribution only.
data "aws_iam_policy_document" "github_deploy" {
  statement {
    sid       = "ListFrontendBucket"
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.frontend.arn]
  }

  statement {
    sid    = "ReadWriteFrontendObjects"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
    ]
    resources = ["${aws_s3_bucket.frontend.arn}/*"]
  }

  statement {
    sid    = "InvalidateDistribution"
    effect = "Allow"
    actions = [
      "cloudfront:CreateInvalidation",
      "cloudfront:GetInvalidation",
    ]
    resources = [aws_cloudfront_distribution.frontend.arn]
  }
}

resource "aws_iam_role_policy" "github_deploy" {
  name   = "${local.name_prefix}-github-deploy"
  role   = aws_iam_role.github_deploy.id
  policy = data.aws_iam_policy_document.github_deploy.json
}
