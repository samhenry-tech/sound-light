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
# Cognito                                                                      #
# --------------------------------------------------------------------------- #

variable "cognito_domain_prefix" {
  description = <<-EOT
    Prefix for the Cognito Hosted UI domain. Must be globally unique within the
    region across all AWS accounts. If 'atmos-auth' is taken, change this.
  EOT
  type        = string
  default     = "atmos-auth"
}

variable "google_client_id" {
  description = "Google OAuth 2.0 client ID for Cognito Google federation."
  type        = string
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth 2.0 client secret for Cognito Google federation."
  type        = string
  default     = ""
  sensitive   = true
}

variable "callback_urls" {
  description = "Allowed OAuth callback (redirect) URLs for the SPA app client."
  type        = list(string)
  default     = ["http://localhost:3000/auth/callback"]
}

variable "logout_urls" {
  description = "Allowed sign-out redirect URLs for the SPA app client."
  type        = list(string)
  default     = ["http://localhost:3000"]
}

# --------------------------------------------------------------------------- #
# API Gateway CORS                                                             #
# --------------------------------------------------------------------------- #

variable "allowed_origins" {
  description = "Origins allowed by the HTTP API CORS configuration."
  type        = list(string)
  default     = ["http://localhost:3000"]
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
