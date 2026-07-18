# Shared locals: naming prefix and common tags applied to every resource.
locals {
  name_prefix = "${var.project}-${var.environment}"

  tags = {
    Project     = "sound-light"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
