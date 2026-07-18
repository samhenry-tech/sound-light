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

  name_prefix = "${local.project}-${local.environment}"

  tags = {
    Project     = "sound-light"
    Environment = local.environment
    ManagedBy   = "Terraform"
  }
}
