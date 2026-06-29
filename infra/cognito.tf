# Cognito user pool with Google federation and a public SPA app client
# (Authorization Code + PKCE via the Hosted UI).

resource "aws_cognito_user_pool" "main" {
  name = "${local.name_prefix}-users"

  # Sign in with email address.
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # Case-insensitive email handling.
  username_configuration {
    case_sensitive = false
  }

  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = false
    temporary_password_validity_days = 7
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Required for federated sign-up: an email is always present.
  schema {
    name                     = "email"
    attribute_data_type      = "String"
    required                 = true
    mutable                  = true
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  # Free-tier friendly: keep the default (no advanced security / no SMS MFA).
  deletion_protection = "INACTIVE"

  tags = local.tags
}

# Hosted UI domain (Amazon-managed prefix domain — no ACM cert needed).
resource "aws_cognito_user_pool_domain" "main" {
  domain       = var.cognito_domain_prefix
  user_pool_id = aws_cognito_user_pool.main.id
}

# Google federation. Only created when Google credentials are supplied so that
# `terraform apply` works for local/email-only setups without Google secrets.
resource "aws_cognito_identity_provider" "google" {
  count = var.google_client_id != "" && var.google_client_secret != "" ? 1 : 0

  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    client_id        = var.google_client_id
    client_secret    = var.google_client_secret
    authorize_scopes = "openid email profile"
  }

  # Map Google claims onto Cognito user-pool attributes.
  attribute_mapping = {
    email    = "email"
    username = "sub"
    name     = "name"
  }
}

# Public SPA app client (no secret) using Authorization Code + PKCE.
resource "aws_cognito_user_pool_client" "spa" {
  name         = "${local.name_prefix}-spa"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = false

  # OAuth / Hosted UI.
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  callback_urls                        = var.callback_urls
  logout_urls                          = var.logout_urls
  supported_identity_providers         = local.cognito_identity_providers

  # SRP for direct username/password auth, plus refresh token rotation.
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  # Token lifetimes: access/id 60 minutes, refresh 30 days.
  access_token_validity  = 60
  id_token_validity      = 60
  refresh_token_validity = 30

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  # Avoid leaking whether an account exists.
  prevent_user_existence_errors = "ENABLED"

  # Ensure the Google IdP exists before the client references it.
  depends_on = [aws_cognito_identity_provider.google]
}
