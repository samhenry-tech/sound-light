# Cognito Identity Pool federating Google Sign-In directly (no user pool).
#
# The browser exchanges a Google ID token for temporary AWS credentials scoped
# to the authenticated IAM role below. Every DynamoDB action is restricted to
# items whose partition key (`owner`) equals the caller's Cognito identity id
# via the `dynamodb:LeadingKeys` condition, so users can only touch their own
# rows — no API layer required.

resource "aws_cognito_identity_pool" "main" {
  identity_pool_name               = "${local.name_prefix}-identity"
  allow_unauthenticated_identities = false
  allow_classic_flow               = false

  # Google is the only login provider. The value is the Google OAuth client id;
  # no client secret is needed for identity-pool federation.
  supported_login_providers = {
    "accounts.google.com" = var.google_client_id
  }

  tags = local.tags
}

# --------------------------------------------------------------------------- #
# IAM role assumed by authenticated (Google-signed-in) identities              #
# --------------------------------------------------------------------------- #

data "aws_iam_policy_document" "authenticated_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = ["cognito-identity.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "cognito-identity.amazonaws.com:aud"
      values   = [aws_cognito_identity_pool.main.id]
    }

    condition {
      test     = "ForAnyValue:StringLike"
      variable = "cognito-identity.amazonaws.com:amr"
      values   = ["authenticated"]
    }
  }
}

resource "aws_iam_role" "authenticated" {
  name               = "${local.name_prefix}-authenticated"
  assume_role_policy = data.aws_iam_policy_document.authenticated_assume.json
  tags               = local.tags
}

# Row-level data access: only the two app tables, only the verbs the SPA uses,
# and ONLY items whose leading (partition) key is the caller's own identity id.
data "aws_iam_policy_document" "authenticated_dynamodb" {
  statement {
    sid    = "OwnRowsOnly"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:BatchGetItem",
    ]
    resources = [
      aws_dynamodb_table.mixes.arn,
      aws_dynamodb_table.user_settings.arn,
    ]

    condition {
      test     = "ForAllValues:StringEquals"
      variable = "dynamodb:LeadingKeys"
      values   = ["$${cognito-identity.amazonaws.com:sub}"]
    }
  }
}

resource "aws_iam_role_policy" "authenticated_dynamodb" {
  name   = "${local.name_prefix}-authenticated-dynamodb"
  role   = aws_iam_role.authenticated.id
  policy = data.aws_iam_policy_document.authenticated_dynamodb.json
}

resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = aws_cognito_identity_pool.main.id

  roles = {
    authenticated = aws_iam_role.authenticated.arn
  }
}
