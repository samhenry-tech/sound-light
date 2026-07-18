# Outputs consumed by the frontend config (src/config.ts).
# The names here are a contract — do not rename without updating that file.
#
# Static hosting (S3 + CloudFront) is NOT provisioned here: the SPA is published
# to the shared `projects.samhenry.tech` bucket + CloudFront by
# .github/workflows/deploy-frontend.yml. This stack owns only Cognito + DynamoDB.

output "cognito_identity_pool_id" {
  description = "Cognito Identity Pool id. Maps to appConfig.cognitoIdentityPoolId."
  value       = aws_cognito_identity_pool.main.id
}

output "mixes_table_name" {
  description = "DynamoDB mixes table name. Maps to appConfig.mixesTable."
  value       = aws_dynamodb_table.mixes.name
}

output "user_settings_table_name" {
  description = "DynamoDB user-settings table name. Maps to appConfig.settingsTable."
  value       = aws_dynamodb_table.user_settings.name
}

output "aws_region" {
  description = "AWS region the stack is deployed in. Maps to appConfig.awsRegion."
  value       = var.region
}
