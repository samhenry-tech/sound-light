# API Gateway HTTP API (v2) fronting the single API Lambda.
#
# All 7 routes are protected by a Cognito JWT authorizer. CORS is handled here
# (NOT in the Lambda). A single AWS_PROXY integration (payload format 2.0) is
# reused by every route.

resource "aws_apigatewayv2_api" "http" {
  name          = "${local.name_prefix}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins  = var.allowed_origins
    allow_methods  = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers  = ["authorization", "content-type"]
    expose_headers = []
    max_age        = 3600
  }

  tags = local.tags
}

# JWT authorizer backed by the Cognito user pool. The audience is the SPA
# client id; the issuer is the user pool's well-known OIDC issuer URL.
resource "aws_apigatewayv2_authorizer" "jwt" {
  api_id           = aws_apigatewayv2_api.http.id
  name             = "${local.name_prefix}-cognito-jwt"
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]

  jwt_configuration {
    issuer   = "https://cognito-idp.${var.region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
    audience = [aws_cognito_user_pool_client.spa.id]
  }
}

# Lambda proxy integration (payload format 2.0).
resource "aws_apigatewayv2_integration" "api" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api.invoke_arn
  payload_format_version = "2.0"
}

# All application routes, each guarded by the JWT authorizer.
locals {
  api_routes = [
    "GET /mixes",
    "POST /mixes",
    "GET /mixes/{id}",
    "PUT /mixes/{id}",
    "DELETE /mixes/{id}",
    "GET /prefs",
    "PUT /prefs",
  ]
}

resource "aws_apigatewayv2_route" "routes" {
  for_each = toset(local.api_routes)

  api_id    = aws_apigatewayv2_api.http.id
  route_key = each.value
  target    = "integrations/${aws_apigatewayv2_integration.api.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

# Auto-deploying default stage (no explicit stage path segment in the URL).
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true
  tags        = local.tags
}

# Allow API Gateway to invoke the Lambda. The source ARN is scoped to this API
# (any stage/method/route under it).
resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowInvokeFromHttpApi"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}
