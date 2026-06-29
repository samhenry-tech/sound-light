# DynamoDB tables (both on-demand / PAY_PER_REQUEST — no standing cost).

# Mixes: partitioned by owner (the Cognito sub) so all of a user's mixes are
# retrieved with a single Query, sorted/identified by id.
resource "aws_dynamodb_table" "mixes" {
  name         = "${local.name_prefix}-mixes"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "owner"
  range_key    = "id"

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

# User preferences: one item per owner (no range key).
resource "aws_dynamodb_table" "user_prefs" {
  name         = "${local.name_prefix}-user-prefs"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "owner"

  attribute {
    name = "owner"
    type = "S"
  }

  tags = local.tags
}
