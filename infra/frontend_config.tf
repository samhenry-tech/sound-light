# Write Terraform outputs the Vite SPA needs into src/config.generated.json.
# Committed so builds work without running apply; refreshed on every apply.
# SPA-only / shared inputs live in config/shared.json (read by both sides).

resource "local_file" "frontend_config" {
  filename        = "${path.module}/../src/config.generated.json"
  file_permission = "0644"

  content = jsonencode({
    cognitoIdentityPoolId = aws_cognito_identity_pool.main.id
    awsRegion             = local.region
    mixesTable            = aws_dynamodb_table.mixes.name
    settingsTable         = aws_dynamodb_table.user_settings.name
  })
}
