# Shared locals: naming prefix and common tags applied to every resource.
locals {
  name_prefix = "${var.project}-${var.environment}"

  tags = {
    Project     = "atmos"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }

  # Whether Google federation is configured (both credentials supplied).
  google_federation_enabled = var.google_client_id != "" && var.google_client_secret != ""

  # Identity providers the SPA app client supports. Google is only included when
  # its credentials are present, so the stack applies cleanly without them.
  cognito_identity_providers = local.google_federation_enabled ? ["COGNITO", "Google"] : ["COGNITO"]
}
