# Outputs consumed by the frontend .env (and the terraform deploy workflow).
# The names here are a contract — do not rename without updating both consumers.
#
# Static hosting (S3 + CloudFront) is NOT provisioned here: the SPA is published
# to the shared `projects.samhenry.tech` bucket + CloudFront by
# .github/workflows/deploy-frontend.yml. This stack owns only Cognito + DynamoDB.

output "cognito_identity_pool_id" {
  description = "Cognito Identity Pool id. Maps to VITE_COGNITO_IDENTITY_POOL_ID."
  value       = aws_cognito_identity_pool.main.id
}

output "mixes_table_name" {
  description = "DynamoDB mixes table name. Maps to VITE_MIXES_TABLE."
  value       = aws_dynamodb_table.mixes.name
}

output "user_settings_table_name" {
  description = "DynamoDB user-settings table name. Maps to VITE_SETTINGS_TABLE."
  value       = aws_dynamodb_table.user_settings.name
}

output "aws_region" {
  description = "AWS region the stack is deployed in. Maps to VITE_AWS_REGION."
  value       = var.region
}
