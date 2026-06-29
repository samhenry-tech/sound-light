# Outputs consumed by the frontend .env and the GitHub Actions workflows.
# The names here are a contract — do not rename without updating both consumers.

output "api_base_url" {
  description = "Base invoke URL of the HTTP API (no trailing slash). Maps to VITE_API_BASE_URL."
  value       = aws_apigatewayv2_api.http.api_endpoint
}

output "cognito_authority" {
  description = "Cognito OIDC issuer URL. Maps to VITE_COGNITO_AUTHORITY."
  value       = "https://cognito-idp.${var.region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
}

output "cognito_client_id" {
  description = "SPA app client id. Maps to VITE_COGNITO_CLIENT_ID."
  value       = aws_cognito_user_pool_client.spa.id
}

output "cognito_hosted_ui_domain" {
  description = "Full https URL of the Cognito Hosted UI domain. Maps to VITE_COGNITO_HOSTED_UI."
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${var.region}.amazoncognito.com"
}

output "cognito_user_pool_id" {
  description = "Cognito user pool id."
  value       = aws_cognito_user_pool.main.id
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
