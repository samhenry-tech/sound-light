# Outputs also written to src/config.generated.json by local_file.frontend_config
# (see frontend_config.tf). The SPA reads that file via src/config.ts.
#
# Static hosting (S3 + CloudFront) is NOT provisioned here: the SPA is published
# to the shared `projects.samhenry.tech` bucket + CloudFront by
# .github/workflows/deploy-frontend.yml. This stack owns only Cognito + DynamoDB.

output "cognito_identity_pool_id" {
  description = "Cognito Identity Pool id. Written to src/config.generated.json."
  value       = aws_cognito_identity_pool.main.id
}

output "mixes_table_name" {
  description = "DynamoDB mixes table name. Written to src/config.generated.json."
  value       = aws_dynamodb_table.mixes.name
}

output "user_settings_table_name" {
  description = "DynamoDB user-settings table name. Written to src/config.generated.json."
  value       = aws_dynamodb_table.user_settings.name
}

output "aws_region" {
  description = "AWS region the stack is deployed in. Written to src/config.generated.json."
  value       = local.region
}
