# Outputs consumed by the frontend .env and the GitHub Actions workflows.
# The names here are a contract — do not rename without updating both consumers.

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

output "frontend_bucket" {
  description = "Name of the private SPA origin bucket. Maps to FRONTEND_BUCKET (deploy workflow)."
  value       = aws_s3_bucket.frontend.bucket
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution id. Maps to CLOUDFRONT_DISTRIBUTION_ID (deploy workflow)."
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_domain" {
  description = "CloudFront *.cloudfront.net domain serving the SPA."
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "github_deploy_role_arn" {
  description = "ARN of the frontend deploy role. Maps to AWS_DEPLOY_ROLE_ARN (deploy workflow)."
  value       = aws_iam_role.github_deploy.arn
}
