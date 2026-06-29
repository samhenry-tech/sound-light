# API Lambda function + least-privilege IAM execution role.
#
# Build note: the deployment package is built from `lambda/api/dist/index.js`,
# which is produced by `npm run build` (esbuild) inside lambda/api BEFORE
# `terraform apply`. CI does this automatically (see .github/workflows/
# terraform.yml). For `terraform validate`/`plan` to work locally without the
# bundle, a committed placeholder keeps the dist directory present; the
# archive_file data source is only fully resolved at apply time.

# --------------------------------------------------------------------------- #
# Deployment package                                                          #
# --------------------------------------------------------------------------- #

data "archive_file" "api" {
  type        = "zip"
  source_file = "${path.module}/lambda/api/dist/index.js"
  output_path = "${path.module}/lambda/api/dist/api.zip"
}

# --------------------------------------------------------------------------- #
# IAM execution role                                                          #
# --------------------------------------------------------------------------- #

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "api_lambda" {
  name               = "${local.name_prefix}-api-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = local.tags
}

# CloudWatch Logs permissions (managed policy).
resource "aws_iam_role_policy_attachment" "api_lambda_basic" {
  role       = aws_iam_role.api_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Least-privilege data access: only the two app tables, only the verbs used.
data "aws_iam_policy_document" "api_lambda_dynamodb" {
  statement {
    sid    = "TableAccess"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:BatchGetItem",
    ]
    resources = [
      aws_dynamodb_table.mixes.arn,
      aws_dynamodb_table.user_prefs.arn,
    ]
  }
}

resource "aws_iam_role_policy" "api_lambda_dynamodb" {
  name   = "${local.name_prefix}-api-dynamodb"
  role   = aws_iam_role.api_lambda.id
  policy = data.aws_iam_policy_document.api_lambda_dynamodb.json
}

# --------------------------------------------------------------------------- #
# Lambda function                                                             #
# --------------------------------------------------------------------------- #

resource "aws_lambda_function" "api" {
  function_name = "${local.name_prefix}-api"
  role          = aws_iam_role.api_lambda.arn

  runtime = "nodejs20.x"
  handler = "index.handler"

  filename         = data.archive_file.api.output_path
  source_code_hash = data.archive_file.api.output_base64sha256

  timeout     = 10
  memory_size = 256

  environment {
    variables = {
      MIXES_TABLE = aws_dynamodb_table.mixes.name
      PREFS_TABLE = aws_dynamodb_table.user_prefs.name
    }
  }

  tags = local.tags
}

# Explicit log group so retention is bounded (and not "never expire").
resource "aws_cloudwatch_log_group" "api_lambda" {
  name              = "/aws/lambda/${aws_lambda_function.api.function_name}"
  retention_in_days = 14
  tags              = local.tags
}
