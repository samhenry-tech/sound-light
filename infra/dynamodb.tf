# DynamoDB tables. Provisioned at 12/12 RCU/WCU each (24 total per dimension)
# so both tables fit inside the always-free allowance (25 RCU + 25 WCU per
# account, summed across tables). On-demand would bill per request instead.

# Mixes: partitioned by owner (the Cognito identity id) so all of a user's
# mixes are retrieved with a single Query, sorted/identified by id.
resource "aws_dynamodb_table" "mixes" {
  name           = "${local.name_prefix}-mixes"
  billing_mode   = "PROVISIONED"
  read_capacity  = 12
  write_capacity = 12
  hash_key       = "owner"
  range_key      = "id"

  attribute {
    name = "owner"
    type = "S"
  }

  attribute {
    name = "id"
    type = "S"
  }

  tags = local.tags
}

# User settings: one item per owner (no range key).
resource "aws_dynamodb_table" "user_settings" {
  name           = "${local.name_prefix}-user-settings"
  billing_mode   = "PROVISIONED"
  read_capacity  = 12
  write_capacity = 12
  hash_key       = "owner"

  attribute {
    name = "owner"
    type = "S"
  }

  tags = local.tags
}
