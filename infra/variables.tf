# Input variables for the atmos infrastructure.

# --------------------------------------------------------------------------- #
# Core / naming                                                               #
# --------------------------------------------------------------------------- #

variable "project" {
  description = "Project slug used as the prefix for resource names and the Project tag."
  type        = string
  default     = "atmos"
}

variable "environment" {
  description = "Deployment environment (used in the name_prefix), e.g. dev/staging/prod."
  type        = string
  default     = "dev"
}

variable "region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "us-east-1"
}

# --------------------------------------------------------------------------- #
# Google Sign-In (Cognito Identity Pool federation)                            #
# --------------------------------------------------------------------------- #

variable "google_client_id" {
  description = <<-EOT
    Google OAuth 2.0 client ID (Web application) registered as the identity
    pool's accounts.google.com login provider. No client secret is required —
    the browser sends Google ID tokens straight to Cognito Identity.
  EOT
  type        = string

  validation {
    condition     = length(var.google_client_id) > 0
    error_message = "google_client_id is required: the identity pool federates Google Sign-In."
  }
}

# --------------------------------------------------------------------------- #
# GitHub OIDC / deploy role                                                    #
# --------------------------------------------------------------------------- #

variable "create_github_oidc_provider" {
  description = <<-EOT
    Whether to create the GitHub Actions OIDC provider in this account. Set to
    false if the provider (token.actions.githubusercontent.com) already exists;
    a data source will be used to look it up instead.
  EOT
  type        = bool
  default     = true
}

variable "github_repo" {
  description = "GitHub repository (owner/name) allowed to assume the deploy roles via OIDC."
  type        = string
  default     = "samhenry-tech/sound-light"
}
