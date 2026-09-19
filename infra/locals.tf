# Shared locals: inputs from config/shared.json, naming prefix, and common tags.
#
# Edit ../config/shared.json to change project/environment/region/Google client
# id (and other public values the SPA also reads). Do not put secrets there.

locals {
  shared = jsondecode(file("${path.module}/../config/shared.json"))

  project          = local.shared.project
  environment      = local.shared.environment
  region           = local.shared.region
  google_client_id = local.shared.googleClientId

  # Cognito identity id of the defaults-catalog admin. Empty until captured
  # after first sign-in (Settings → Account). Write IAM is omitted while blank.
  defaults_admin_identity_id = try(local.shared.defaultsAdminIdentityId, "")

  # Fixed partition key for shared default playlists in the playlists table.
  defaults_owner = "defaults"

  name_prefix = "${local.project}-${local.environment}"

  tags = {
    Project     = "sound-light"
    Environment = local.environment
    ManagedBy   = "Terraform"
  }
}
